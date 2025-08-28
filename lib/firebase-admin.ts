// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK
let adminApp
try {
  if (!getApps().length) {
    // For development, we'll use the client config
    // In production, you should use proper admin credentials
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }, 'admin')
  } else {
    adminApp = getApps().find(app => app.name === 'admin') || getApps()[0]
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error)
}

export const adminDb = adminApp ? getFirestore(adminApp) : null

// Server-side Firestore service for API routes
// Helper function to convert Firestore timestamps
const convertFirestoreTimestamps = (data: any) => {
  if (!data) return data
  
  const converted = { ...data }
  const timestampFields = ['created_at', 'updated_at', 'last_login', 'completed_at']
  
  timestampFields.forEach(field => {
    if (converted[field] && converted[field].toDate) {
      converted[field] = converted[field].toDate().toISOString()
    }
  })
  
  return converted
}

export const serverFirestoreService = {
  users: {
    async getByEmail(email: string) {
      if (!adminDb) return null
      try {
        const snapshot = await adminDb.collection('users')
          .where('email', '==', email)
          .limit(1)
          .get()
        
        if (snapshot.empty) return null
        
        const doc = snapshot.docs[0]
        return convertFirestoreTimestamps({ id: doc.id, ...doc.data() })
      } catch (error) {
        console.error('Error fetching user by email:', error)
        return null
      }
    },

    async create(userData: any) {
      if (!adminDb) throw new Error('Admin DB not initialized')
      try {
        const docRef = await adminDb.collection('users').add({
          ...userData,
          created_at: new Date(),
          updated_at: new Date(),
          last_login: new Date()
        })
        return docRef.id
      } catch (error) {
        console.error('Error creating user:', error)
        throw error
      }
    },

    async updateLastLogin(id: string) {
      if (!adminDb) throw new Error('Admin DB not initialized')
      try {
        await adminDb.collection('users').doc(id).update({
          last_login: new Date(),
          updated_at: new Date(),
        })
      } catch (error) {
        console.error('Error updating user last login:', error)
        throw error
      }
    }
  },

  surveys: {
    async getPublished() {
      if (!adminDb) return []
      try {
        const snapshot = await adminDb.collection('surveys')
          .where('is_published', '==', true)
          .orderBy('created_at', 'desc')
          .get()
        
        return snapshot.docs.map(doc => 
          convertFirestoreTimestamps({ id: doc.id, ...doc.data() })
        )
      } catch (error) {
        console.error('Error fetching published surveys:', error)
        return []
      }
    },

    async getUserSurveys(creatorId: string) {
      if (!adminDb) return []
      try {
        const snapshot = await adminDb.collection('surveys')
          .where('creator_id', '==', creatorId)
          .orderBy('created_at', 'desc')
          .get()
        
        return snapshot.docs.map(doc => 
          convertFirestoreTimestamps({ id: doc.id, ...doc.data() })
        )
      } catch (error) {
        console.error('Error fetching user surveys:', error)
        return []
      }
    },

    async getById(id: string) {
      if (!adminDb) return null
      try {
        const doc = await adminDb.collection('surveys').doc(id).get()
        return doc.exists ? { id: doc.id, ...doc.data() } : null
      } catch (error) {
        console.error('Error fetching survey:', error)
        return null
      }
    },

    async create(surveyData: any) {
      if (!adminDb) throw new Error('Admin DB not initialized')
      try {
        const docRef = await adminDb.collection('surveys').add({
          ...surveyData,
          response_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        })
        const createdSurvey = await docRef.get()
        return convertFirestoreTimestamps({ id: docRef.id, ...createdSurvey.data() })
      } catch (error) {
        console.error('Error creating survey:', error)
        throw error
      }
    },

    async update(id: string, updates: any) {
      if (!adminDb) throw new Error('Admin DB not initialized')
      try {
        await adminDb.collection('surveys').doc(id).update({
          ...updates,
          updated_at: new Date(),
        })
        
        const updatedDoc = await adminDb.collection('surveys').doc(id).get()
        return convertFirestoreTimestamps({ id, ...updatedDoc.data() })
      } catch (error) {
        console.error('Error updating survey:', error)
        throw error
      }
    },

    async delete(id: string) {
      if (!adminDb) throw new Error('Admin DB not initialized')
      try {
        // Get survey before deletion for return info
        const surveyDoc = await adminDb.collection('surveys').doc(id).get()
        
        if (!surveyDoc.exists) {
          throw new Error('Survey not found')
        }
        
        const surveyData = surveyDoc.data()
        
        // Delete the survey
        await adminDb.collection('surveys').doc(id).delete()
        
        // Return points if no responses and update user
        const pointsReturned = surveyData?.response_count === 0 ? surveyData.creator_points : 0
        
        if (pointsReturned > 0 && surveyData?.creator_id) {
          const userDoc = await adminDb.collection('users').doc(surveyData.creator_id).get()
          if (userDoc.exists) {
            const currentPoints = userDoc.data()?.points || 0
            await adminDb.collection('users').doc(surveyData.creator_id).update({
              points: currentPoints + pointsReturned,
              updated_at: new Date()
            })
          }
        }
        
        return {
          survey: convertFirestoreTimestamps({ id, ...surveyData }),
          pointsReturned
        }
      } catch (error) {
        console.error('Error deleting survey:', error)
        throw error
      }
    }
  },

  responses: {
    async getBySurvey(surveyId: string) {
      if (!adminDb) return []
      try {
        const snapshot = await adminDb.collection('survey_responses')
          .where('survey_id', '==', surveyId)
          .get()
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (error) {
        console.error('Error fetching responses:', error)
        return []
      }
    },

    async create(responseData: any) {
      if (!adminDb) throw new Error('Admin DB not initialized')
      try {
        const docRef = await adminDb.collection('survey_responses').add({
          ...responseData,
          completed_at: new Date(),
        })
        return docRef.id
      } catch (error) {
        console.error('Error creating response:', error)
        throw error
      }
    }
  },

  users: {
    async getById(id: string) {
      if (!adminDb) return null
      try {
        const doc = await adminDb.collection('users').doc(id).get()
        return doc.exists ? { id: doc.id, ...doc.data() } : null
      } catch (error) {
        console.error('Error fetching user:', error)
        return null
      }
    },

    async update(id: string, updates: any) {
      if (!adminDb) throw new Error('Admin DB not initialized')
      try {
        await adminDb.collection('users').doc(id).update({
          ...updates,
          updated_at: new Date(),
        })
      } catch (error) {
        console.error('Error updating user:', error)
        throw error
      }
    }
  }
}