require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findDuplicateUsers() {
  try {
    console.log('🔍 Checking for duplicate users...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const emailMap = new Map();
    const duplicates = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const email = data.email;
      
      if (emailMap.has(email)) {
        // Found duplicate
        const existing = emailMap.get(email);
        duplicates.push({
          email: email,
          docs: [existing, { id: doc.id, data: data }]
        });
        console.log(`❌ Duplicate found for ${email}:`);
        console.log(`   - Document 1: ${existing.id} (created: ${existing.data.created_at})`);
        console.log(`   - Document 2: ${doc.id} (created: ${data.created_at})`);
      } else {
        emailMap.set(email, { id: doc.id, data: data });
      }
    });
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate users found');
      return;
    }
    
    console.log(`\n📊 Found ${duplicates.length} sets of duplicate users`);
    
    // Show details for each duplicate set
    for (const duplicate of duplicates) {
      console.log(`\n📧 Email: ${duplicate.email}`);
      duplicate.docs.forEach((doc, index) => {
        console.log(`   Document ${index + 1}:`);
        console.log(`   - ID: ${doc.id}`);
        console.log(`   - Created: ${doc.data.created_at}`);
        console.log(`   - Points: ${doc.data.points || 0}`);
        console.log(`   - Surveys Created: ${doc.data.surveys_created || 0}`);
        console.log(`   - Last Login: ${doc.data.last_login}`);
      });
    }
    
    return duplicates;
  } catch (error) {
    console.error('Error finding duplicate users:', error);
  }
}

async function cleanupDuplicates(duplicates, dryRun = true) {
  if (!duplicates || duplicates.length === 0) {
    console.log('No duplicates to clean up');
    return;
  }
  
  console.log(`\n🧹 ${dryRun ? 'DRY RUN - ' : ''}Cleaning up duplicates...`);
  
  for (const duplicate of duplicates) {
    console.log(`\n📧 Processing ${duplicate.email}:`);
    
    // Sort by creation date, keep the oldest one
    const sortedDocs = duplicate.docs.sort((a, b) => {
      const dateA = a.data.created_at?.seconds || 0;
      const dateB = b.data.created_at?.seconds || 0;
      return dateA - dateB;
    });
    
    const toKeep = sortedDocs[0];
    const toDelete = sortedDocs.slice(1);
    
    console.log(`   ✅ Keeping: ${toKeep.id} (oldest)`);
    
    for (const docToDelete of toDelete) {
      console.log(`   ${dryRun ? '🔍 Would delete' : '❌ Deleting'}: ${docToDelete.id}`);
      
      if (!dryRun) {
        try {
          await deleteDoc(doc(db, 'users', docToDelete.id));
          console.log(`   ✅ Deleted ${docToDelete.id}`);
        } catch (error) {
          console.error(`   ❌ Failed to delete ${docToDelete.id}:`, error);
        }
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting duplicate user cleanup script');
  console.log('📋 Project:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  
  const duplicates = await findDuplicateUsers();
  
  if (duplicates && duplicates.length > 0) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made');
    await cleanupDuplicates(duplicates, true);
    
    console.log('\n💡 To actually perform the cleanup, run:');
    console.log('   node scripts/cleanup-duplicate-users.js --execute');
  }
  
  console.log('\n✅ Script completed');
}

// Check for --execute flag
const shouldExecute = process.argv.includes('--execute');

if (shouldExecute) {
  console.log('⚠️  EXECUTING CLEANUP - This will permanently delete duplicate records!');
  setTimeout(async () => {
    const duplicates = await findDuplicateUsers();
    await cleanupDuplicates(duplicates, false);
  }, 3000);
} else {
  main().catch(console.error);
}