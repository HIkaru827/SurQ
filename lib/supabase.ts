// Firebase Firestore database service functions
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore'
import { db } from './firebase'
import { User, Survey, SurveyResponse, UserAchievement } from './firebase'

// Guard function to ensure db is available
function getDb() {
  if (!db) {
    throw new Error('Firestore is not initialized. Make sure you\'re running this on the client side.')
  }
  return db
}

// Helper function to convert Firestore document to typed object
const convertDocToData = <T>(doc: QueryDocumentSnapshot<DocumentData>): T & { id: string } => ({
  id: doc.id,
  ...doc.data(),
} as T & { id: string })

export const firestoreService = {
  // Users collection
  users: {
    async getAll(): Promise<User[]> {
      const database = getDb()
      const querySnapshot = await getDocs(collection(database, 'users'))
      return querySnapshot.docs.map(doc => convertDocToData<User>(doc))
    },
    
    async getById(id: string): Promise<User | null> {
      const database = getDb()
      const docRef = doc(database, 'users', id)
      const docSnap = await getDoc(docRef)
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as User : null
    },
    
    async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
      const database = getDb()
      const docRef = await addDoc(collection(database, 'users'), {
        ...userData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
      return docRef.id
    },
    
    async update(id: string, updates: Partial<User>): Promise<void> {
      const database = getDb()
      const docRef = doc(database, 'users', id)
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp(),
      })
    },
    
    async delete(id: string): Promise<void> {
      const database = getDb()
      await deleteDoc(doc(database, 'users', id))
    }
  },

  // Surveys collection
  surveys: {
    async getAll(): Promise<Survey[]> {
      const database = getDb()
      const querySnapshot = await getDocs(collection(database, 'surveys'))
      return querySnapshot.docs.map(doc => convertDocToData<Survey>(doc))
    },
    
    async getById(id: string): Promise<Survey | null> {
      const database = getDb()
      const docRef = doc(database, 'surveys', id)
      const docSnap = await getDoc(docRef)
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Survey : null
    },
    
    async getByCreator(creatorId: string): Promise<Survey[]> {
      const database = getDb()
      const q = query(collection(database, 'surveys'), where('creator_id', '==', creatorId))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => convertDocToData<Survey>(doc))
    },
    
    async getPublished(): Promise<Survey[]> {
      const database = getDb()
      const q = query(
        collection(database, 'surveys'), 
        where('is_published', '==', true),
        orderBy('created_at', 'desc')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => convertDocToData<Survey>(doc))
    },
    
    async create(surveyData: Omit<Survey, 'id' | 'created_at' | 'updated_at' | 'response_count'>): Promise<string> {
      const database = getDb()
      const docRef = await addDoc(collection(database, 'surveys'), {
        ...surveyData,
        response_count: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
      return docRef.id
    },
    
    async update(id: string, updates: Partial<Survey>): Promise<void> {
      const database = getDb()
      const docRef = doc(database, 'surveys', id)
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp(),
      })
    },
    
    async delete(id: string): Promise<void> {
      const database = getDb()
      await deleteDoc(doc(database, 'surveys', id))
    }
  },

  // Survey responses collection
  responses: {
    async getBySurvey(surveyId: string): Promise<SurveyResponse[]> {
      const database = getDb()
      const q = query(collection(database, 'survey_responses'), where('survey_id', '==', surveyId))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => convertDocToData<SurveyResponse>(doc))
    },
    
    async create(responseData: Omit<SurveyResponse, 'id' | 'completed_at'>): Promise<string> {
      const database = getDb()
      const docRef = await addDoc(collection(database, 'survey_responses'), {
        ...responseData,
        completed_at: serverTimestamp(),
      })
      return docRef.id
    }
  },

  // User achievements collection
  achievements: {
    async getByUser(userId: string): Promise<UserAchievement[]> {
      const database = getDb()
      const q = query(collection(database, 'user_achievements'), where('user_id', '==', userId))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => convertDocToData<UserAchievement>(doc))
    },
    
    async create(achievementData: Omit<UserAchievement, 'id' | 'earned_at'>): Promise<string> {
      const database = getDb()
      const docRef = await addDoc(collection(database, 'user_achievements'), {
        ...achievementData,
        earned_at: serverTimestamp(),
      })
      return docRef.id
    }
  }
}

// Legacy compatibility - keeping the same interface for easier migration
export const supabase = {
  from: (table: string) => ({
    select: () => {
      switch (table) {
        case 'users':
          return firestoreService.users.getAll()
        case 'surveys':
          return firestoreService.surveys.getAll()
        case 'survey_responses':
          return Promise.resolve([])
        default:
          return Promise.resolve([])
      }
    },
    insert: (data: any) => {
      switch (table) {
        case 'users':
          return firestoreService.users.create(data)
        case 'surveys':
          return firestoreService.surveys.create(data)
        default:
          return Promise.resolve(null)
      }
    },
    update: (data: any) => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
}
