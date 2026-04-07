import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// CONFIG của mày
const firebaseConfig = {
  apiKey: "AIzaSyDwsrMQn_mbMIL_ZoNpiJcWu7SccSVSfk0",
  authDomain: "skycast-5b2c7.firebaseapp.com",
  projectId: "skycast-5b2c7",
  storageBucket: "skycast-5b2c7.firebasestorage.app",
  messagingSenderId: "226194876823",
  appId: "1:226194876823:web:ce019b2611283d9b727cd2",
  measurementId: "G-XE2XP41DMM"
};

// INIT
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// HANDLE REGISTER
document.getElementById("signupForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const fullname = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // VALIDATE
  if (!fullname || !email || !password || !confirmPassword) {
    alert("Vui lòng nhập đầy đủ thông tin");
    return;
  }

  if (password !== confirmPassword) {
    alert("Mật khẩu không khớp");
    return;
  }

  if (password.length < 6) {
    alert("Mật khẩu phải >= 6 ký tự");
    return;
  }

  // CREATE USER
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Lưu tên người dùng
      return updateProfile(userCredential.user, {
        displayName: fullname
      });
    })
    .then(() => {
      alert("Đăng ký thành công!");

      // 👉 QUAN TRỌNG: quay về trang login
      window.location.href = "../Sign-in/index.html";
    })
    .catch((error) => {
      alert(error.message);
    });
});