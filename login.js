import { auth, signInWithEmailAndPassword, googleProvider, signInWithPopup, db, doc, getDoc, setDoc } from './firebase-init.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const error = document.getElementById('loginError');
  const btn = form.querySelector('button[type="submit"]');
  error.hidden = true; btn.disabled = true; btn.textContent = 'جاري التحقق...';
  
  const email = form.email.value;
  const password = form.password.value;
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.href = 'index.html';
  } catch (err) {
    error.textContent = 'خطأ في البريد الإلكتروني أو كلمة المرور.';
    error.hidden = false;
  } finally {
    btn.disabled = false; btn.textContent = 'تسجيل الدخول';
  }
});

document.getElementById('googleLogin').addEventListener('click', async (e) => {
  const error = document.getElementById('loginError') || document.getElementById('registerError');
  if(error) error.hidden = true;
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const userRef = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(userRef);
    
    if (snap.exists() && snap.data().stream) {
      location.href = 'index.html';
    } else {
      const card = document.querySelector('.login-card');
      card.innerHTML = `
        <div class="brand">
          <img src="logo.jpg" alt="Logo" style="height: 60px; border-radius: 8px; mix-blend-mode: multiply;">
          <span style="font-weight: bold; color: #333; font-size: 1.2em;">خُطى | رفيقك نحو التفوق</span>
        </div>
        <h1 style="text-align:center;">خطوة أخيرة!</h1>
        <p style="text-align:center; margin-bottom: 20px;">أهلاً بك في خُطى.. يرجى تحديد فرعك الدراسي لإكمال التسجيل.</p>
        <form id="streamForm">
          <label>الفرع الدراسي
            <select id="streamSelect" required>
              <option value="علمي">علمي</option>
              <option value="أدبي">أدبي</option>
            </select>
          </label>
          <button type="submit" style="background: #4285F4; width: 100%; margin-top: 15px;">حفظ الدخول</button>
        </form>
      `;
      document.getElementById('streamForm').onsubmit = async (se) => {
        se.preventDefault();
        const stream = document.getElementById('streamSelect').value;
        const btn = se.target.querySelector('button');
        btn.disabled = true; btn.textContent = 'جاري الحفظ...';
        await setDoc(userRef, {
          name: cred.user.displayName || cred.user.email.split('@')[0],
          stream: stream,
          email: cred.user.email
        }, { merge: true });
        location.href = 'index.html';
      };
    }
  } catch (err) {
    if(error) {
      error.textContent = 'فشل الدخول بواسطة جوجل. قد يكون السبب عدم إضافة النطاق في إعدادات Firebase.';
      error.hidden = false;
    }
  }
});