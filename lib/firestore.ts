import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  increment
} from 'firebase/firestore'
import { db } from './firebase'

// Collection references
export const COLLECTIONS = {
  USERS: 'users',
  SURVEYS: 'surveys',
  SURVEY_RESPONSES: 'survey_responses',
  USER_ACHIEVEMENTS: 'user_achievements'
} as const

// Check if Firebase/Firestore is available
const checkFirestore = () => {
  if (typeof window === 'undefined') {
    throw new Error('Firestore operations must be performed on client side')
  }
  if (!db) {
    throw new Error('Firestore not initialized - please check Firebase configuration')
  }
}

// User operations
export const createUser = async (userData: {
  email: string
  name: string
  avatar_url?: string | null
}) => {
  checkFirestore()
  
  const userDoc = {
    ...userData,
    // points: 50, // 廃止 - 回答数ベースのシステムに移行
    level: 1,
    badges: [],
    surveys_created: 0,
    surveys_answered: 0,
    total_responses_received: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    last_login: serverTimestamp()
  }
  
  const docRef = await addDoc(collection(db!, COLLECTIONS.USERS), userDoc)
  return { id: docRef.id, ...userDoc }
}

export const getUserByEmail = async (email: string) => {
  checkFirestore()
  
  const q = query(
    collection(db!, COLLECTIONS.USERS), 
    where('email', '==', email),
    limit(1)
  )
  const querySnapshot = await getDocs(q)
  
  if (querySnapshot.empty) {
    return null
  }
  
  const doc = querySnapshot.docs[0]
  return { id: doc.id, ...doc.data() }
}

export const updateUser = async (userId: string, updates: any) => {
  if (!db) throw new Error('Firestore not initialized')
  
  const userRef = doc(db, COLLECTIONS.USERS, userId)
  await updateDoc(userRef, {
    ...updates,
    updated_at: serverTimestamp()
  })
}

export const updateUserLastLogin = async (userId: string) => {
  if (!db) throw new Error('Firestore not initialized')
  
  const userRef = doc(db, COLLECTIONS.USERS, userId)
  await updateDoc(userRef, {
    last_login: serverTimestamp(),
    updated_at: serverTimestamp()
  })
}

// Survey operations
export const createSurvey = async (surveyData: {
  title: string
  description?: string | null
  creator_id: string
  questions: any[]
  is_published: boolean
  // respondent_points: number // 廃止
  // creator_points: number // 廃止
}) => {
  if (!db) throw new Error('Firestore not initialized')
  
  const surveyDoc = {
    ...surveyData,
    response_count: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.SURVEYS), surveyDoc)
  return { id: docRef.id, ...surveyDoc }
}

export const getSurvey = async (surveyId: string) => {
  if (!db) throw new Error('Firestore not initialized')
  
  const surveyRef = doc(db, COLLECTIONS.SURVEYS, surveyId)
  const surveyDoc = await getDoc(surveyRef)
  
  if (!surveyDoc.exists()) {
    return null
  }
  
  return { id: surveyDoc.id, ...surveyDoc.data() }
}

export const getPublishedSurveys = async () => {
  if (!db) throw new Error('Firestore not initialized')
  
  const q = query(
    collection(db, COLLECTIONS.SURVEYS),
    where('is_published', '==', true),
    orderBy('created_at', 'desc')
  )
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as any)
  }))
}

export const getUserSurveys = async (creatorId: string, includeUnpublished: boolean = true) => {
  if (!db) throw new Error('Firestore not initialized')
  
  let q
  if (includeUnpublished) {
    q = query(
      collection(db, COLLECTIONS.SURVEYS),
      where('creator_id', '==', creatorId),
      orderBy('created_at', 'desc')
    )
  } else {
    q = query(
      collection(db, COLLECTIONS.SURVEYS),
      where('creator_id', '==', creatorId),
      where('is_published', '==', true),
      orderBy('created_at', 'desc')
    )
  }
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as any)
  }))
}

export const updateSurvey = async (surveyId: string, updates: any) => {
  if (!db) throw new Error('Firestore not initialized')
  
  const surveyRef = doc(db, COLLECTIONS.SURVEYS, surveyId)
  await updateDoc(surveyRef, {
    ...updates,
    updated_at: serverTimestamp()
  })
}

export const deleteSurvey = async (surveyId: string) => {
  if (!db) throw new Error('Firestore not initialized')
  
  // First get the survey to return post count information
  const survey = await getSurvey(surveyId)
  if (!survey) {
    throw new Error('Survey not found')
  }
  
  // Delete the survey
  const surveyRef = doc(db, COLLECTIONS.SURVEYS, surveyId)
  await deleteDoc(surveyRef)
  
  // If no responses, decrement surveys_created (return post quota)
  const shouldReturnPostQuota = (survey as any).response_count === 0
  
  if (shouldReturnPostQuota) {
    const userRef = doc(db, COLLECTIONS.USERS, (survey as any).creator_id)
    await updateDoc(userRef, {
      surveys_created: increment(-1),
      updated_at: serverTimestamp()
    })
  }
  
  return {
    survey,
    postQuotaReturned: shouldReturnPostQuota
  }
}

export const incrementSurveyResponseCount = async (surveyId: string) => {
  if (!db) throw new Error('Firestore not initialized')
  
  const surveyRef = doc(db, COLLECTIONS.SURVEYS, surveyId)
  await updateDoc(surveyRef, {
    response_count: increment(1),
    updated_at: serverTimestamp()
  })
}

// Survey Response operations
export const createSurveyResponse = async (responseData: {
  survey_id: string
  respondent_id: string | null
  answers: any
}) => {
  if (!db) throw new Error('Firestore not initialized')
  
  const responseDoc = {
    ...responseData,
    completed_at: serverTimestamp()
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.SURVEY_RESPONSES), responseDoc)
  return { id: docRef.id, ...responseDoc }
}

export const getSurveyResponses = async (surveyId: string) => {
  if (!db) throw new Error('Firestore not initialized')
  
  const q = query(
    collection(db, COLLECTIONS.SURVEY_RESPONSES),
    where('survey_id', '==', surveyId),
    orderBy('completed_at', 'desc')
  )
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as any)
  }))
}

// Helper function to convert Firestore timestamps to ISO strings for frontend
export const convertTimestamps = (data: any) => {
  if (!data) return data
  
  const converted = { ...data }
  
  // Convert common timestamp fields
  const timestampFields = ['created_at', 'updated_at', 'last_login', 'completed_at']
  
  timestampFields.forEach(field => {
    if (converted[field] && typeof converted[field].toDate === 'function') {
      converted[field] = converted[field].toDate().toISOString()
    }
  })
  
  return converted
}