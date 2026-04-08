import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDwsrMQn_mbMIL_ZoNpiJcWu7SccSVSfk0",
    authDomain: "skycast-5b2c7.firebaseapp.com",
    projectId: "skycast-5b2c7",
    storageBucket: "skycast-5b2c7.firebasestorage.app",
    messagingSenderId: "226194876823",
    appId: "1:226194876823:web:ce019b2611283d9b727cd2",
    measurementId: "G-XE2XP41DMM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 👉 đặt ngoài
let tempEmail = "";
let tempPassword = "";
let tempName = "";

// ✅ SUBMIT → gửi OTP
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullname = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!fullname || !email || !password || !confirmPassword) {
    alert("Please fill all fields");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  tempEmail = email;
  tempPassword = password;
  tempName = fullname;

  const res = await fetch("http://localhost:3000/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();

  if (data.success) {
    alert("OTP sent!");
    document.getElementById("otpBox").style.display = "block";
  } else {
    alert("Failed to send OTP");
  }
});

// ✅ VERIFY OTP
document.getElementById("verifyOtpBtn").addEventListener("click", async () => {
  const otp = document.getElementById("otp").value;

  const res = await fetch("http://localhost:3000/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: tempEmail,
      otp: otp
    })
  });

  const data = await res.json();

  if (data.success) {
    createUserWithEmailAndPassword(auth, tempEmail, tempPassword)
      .then((userCredential) => {
        return updateProfile(userCredential.user, {
          displayName: tempName
        });
      })
      .then(() => {
        alert("Register success!");
        window.location.href = "../Sign-in/index.html";
      })
      .catch((err) => alert(err.message));
  } else {
    alert("Invalid or expired OTP");
  }
});

onAuthStateChanged(auth, (user) => {
  const avatar = document.getElementById("avatar");

  if (!user) {
    window.location.href = "../../Sign-in/index.html";
  } else {
    if (avatar) {
      avatar.src = user.photoURL;

      avatar.onclick = () => {
        if (confirm("Logout?")) {
          signOut(auth).then(() => {
            window.location.href = "../../Sign-in/index.html";
          });
        }
      };
    }
  }
});

const googleBtn = document.querySelector(".btn-google");

googleBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);

    const user = result.user;

    alert("Login with Google success!");

    window.location.href = "../Dashboard/frontend/dashboard.html"; // chỉnh link tùy mày

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});