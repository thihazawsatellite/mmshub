// app.js

// 🔑 STEP 1: Firebase Config ကို ထည့်သွင်းခြင်း
// Vercel Environment Variables မှ ရရှိသော Keys များကို ဤနေရာတွင် ထည့်သွင်းပါ။
// (မှတ်ချက်: Vercel မှာ Deploy လုပ်သောအခါ ဤနေရာတွင် Hardcode မလုပ်သင့်ဘဲ Environment Variables ကိုသာ သုံးပါ)

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY", // <--- VERCEL ENV မှာ လာမယ့် Key
    authDomain: "mmshub-fc4c1.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    // ... ကျန်တဲ့ config များ
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// -------------------------------------------------------------
// STEP 2: Subscription Status စစ်ဆေးခြင်း Logic (Menu Bar အတွက်)
// -------------------------------------------------------------

const calculateRemainingDays = (expiryDateTimestamp) => {
    const expiryTimestamp = expiryDateTimestamp.toDate().getTime();
    const currentTimestamp = new Date().getTime();
    const differenceInTime = expiryTimestamp - currentTimestamp;
    
    if (differenceInTime <= 0) return 0;
    
    return Math.ceil(differenceInTime / (1000 * 3600 * 24));
};


const updateSubscriptionStatusUI = async (user) => {
    const statusEl = document.getElementById('user-status');
    const viberCta = document.getElementById('viber-cta');
    
    if (!user) {
        statusEl.textContent = '👥 Log in လုပ္ပါ။';
        viberCta.style.display = 'none';
        return;
    }

    const docRef = db.collection("users").doc(user.uid);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
        const data = docSnap.data();
        const remainingDays = calculateRemainingDays(data.expiry_date);

        if (remainingDays > 0) {
            statusEl.textContent = `📅 ကျန်ရှိရက်: ${remainingDays} ရက်`;
            viberCta.style.display = 'none';
        } else {
            statusEl.textContent = '❌ သက်တမ်းကုန်ပြီ!';
            viberCta.style.display = 'block'; // သက်တမ်းကုန်ရင် Viber CTA ကို ပြမယ်
        }
    } else {
        statusEl.textContent = '✅ အကောင့်အသစ်!'; // အကောင့်အသစ်ဆိုရင် စမ်းသပ်ခွင့် ပေးနိုင်
    }
};

// Firebase User State ပြောင်းလဲတိုင်း UI ကို Update လုပ်ရန်
auth.onAuthStateChanged(updateSubscriptionStatusUI);

// -------------------------------------------------------------
// STEP 3: Channel Data များကို Firebase မှ ခေါ်ယူပြီး UI တွင် ပြသခြင်း
// -------------------------------------------------------------

const fetchAndDisplayEvents = async () => {
    const liveList = document.getElementById('live-list');
    const replayList = document.getElementById('replay-list');
    
    // Firestore မှ events များကို ခေါ်ယူရန်
    const snapshot = await db.collection('events').get();
    
    snapshot.forEach(doc => {
        const event = doc.data();
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `<h3>${event.title}</h3>`;
        
        card.addEventListener('click', () => {
            handleVideoPlayback(event.stream_url); // နှိပ်ရင် video ဖွင့်မယ်
        });

        if (event.stream_type === 'Live') {
            liveList.appendChild(card);
        } else if (event.stream_type === 'Replay') {
            replayList.appendChild(card);
        }
    });
};

// App စတင်သည်နှင့် ခေါ်ယူရန်
fetchAndDisplayEvents();

// -------------------------------------------------------------
// STEP 4: ဗီဒီယိုဖွင့်ရန် စစ်ဆေးခြင်း Logic
// -------------------------------------------------------------

const handleVideoPlayback = async (streamUrl) => {
    const user = auth.currentUser;
    if (!user) {
        alert('ဗီဒီယိုကြည့်ရှုရန် Log in ဝင်ပါ။');
        return;
    }

    // Subscription စစ်ဆေးခြင်း
    const status = await (await db.collection("users").doc(user.uid).get()).data();
    const remainingDays = calculateRemainingDays(status.expiry_date);

    if (remainingDays <= 0) {
        alert('❌ သင့် Subscription သက်တမ်းကုန်နေပြီ။');
        document.getElementById('viber-cta').style.display = 'block';
        return;
    }

    // ဖွင့်ခွင့်ရရင် Player ကို စတင်ရန်
    console.log(`Streaming: ${streamUrl}`);
    // ဤနေရာတွင် HLS/DASH Player Library (ဥပမာ: video.js) ကို အသုံးပြုပြီး streamUrl ကို ဖွင့်ပါမည်။
    // initializePlayer(streamUrl); 
};
