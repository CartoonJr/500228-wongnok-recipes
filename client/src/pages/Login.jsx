// pages/Login.jsx
// Import โมดูลที่จำเป็น
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // useNavigate สำหรับ redirect, Link สำหรับสร้างลิงก์

// ค่าเริ่มต้นสำหรับฟอร์ม
const INITIAL_FORM_STATE = { email: '', password: '' };

// คอมโพเนนต์สำหรับหน้าล็อกอิน
const Login = ({ setUser, apiBaseUrl }) => {
  // State สำหรับเก็บข้อมูลในฟอร์ม (อีเมล, รหัสผ่าน)
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  // State สำหรับเก็บข้อความข้อผิดพลาด
  const [error, setError] = useState('');
  // State สำหรับสถานะการโหลด (กำลัง submit)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate(); // Hook สำหรับการ redirect หน้า

  // ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลงค่าใน input field
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  // ฟังก์ชันสำหรับจัดการการ submit ฟอร์มล็อกอิน
  const handleSubmit = async (e) => {
    e.preventDefault(); // ป้องกันการ refresh หน้าเมื่อ submit ฟอร์ม
    setError(''); // ล้างข้อความข้อผิดพลาดเก่า
    setIsSubmitting(true); // เริ่มการ submit

    // ตรวจสอบ input เบื้องต้น
    if (!form.email || !form.password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      setIsSubmitting(false);
      return;
    }

    try {
      // ส่ง request ไปยัง API เพื่อทำการล็อกอิน
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form), // แปลงข้อมูลฟอร์มเป็น JSON string
      });

      const data = await response.json(); // รับข้อมูลที่ตอบกลับจาก API

      if (response.ok) {
        // หากล็อกอินสำเร็จ
        localStorage.setItem('user', JSON.stringify(data.user)); // เก็บข้อมูลผู้ใช้ใน localStorage
        setUser(data.user); // อัปเดต user state ใน App component
        navigate('/'); // Redirect ไปยังหน้าแรก
      } else {
        // หากล็อกอินไม่สำเร็จ
        setError(data.error || 'เข้าสู่ระบบล้มเหลว ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error('Login error:', err); // แสดงข้อผิดพลาดใน console
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false); // สิ้นสุดการ submit
    }
  };

  // ส่วน UI ของคอมโพเนนต์
  return (
    <div className="form-container">
      <h2>เข้าสู่ระบบ</h2>
      <form className="form" onSubmit={handleSubmit} noValidate> {/* เพิ่ม noValidate เพื่อใช้ custom validation */}
        <div>
          <label htmlFor="email">อีเมล:</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="กรอกอีเมลของคุณ"
            value={form.email}
            onChange={handleChange}
            required
            aria-describedby="email-error"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="password">รหัสผ่าน:</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="กรอกรหัสผ่านของคุณ"
            value={form.password}
            onChange={handleChange}
            required
            aria-describedby="password-error"
            disabled={isSubmitting}
          />
        </div>
        {/* แสดงข้อความข้อผิดพลาด (ถ้ามี) */}
        {error && <p id="login-error" className="error-msg" role="alert">{error}</p>}

        <button type="submit" className='btn-submit' disabled={isSubmitting}>
          {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <p>ยังไม่มีบัญชี? <Link to="/register" className="link-primary">สมัครสมาชิกที่นี่</Link></p>
      </div>
    </div>
  );
};

export default Login;
