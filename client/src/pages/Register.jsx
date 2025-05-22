// pages/Register.jsx
// Import โมดูลที่จำเป็น
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // เพิ่ม Link

// ค่าเริ่มต้นสำหรับฟอร์ม
const INITIAL_FORM_STATE = { username: '', email: '', password: '', confirmPassword: '' };

// คอมโพเนนต์สำหรับหน้าลงทะเบียน
const Register = ({ apiBaseUrl }) => {
  // State สำหรับเก็บข้อมูลในฟอร์ม
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

  // ฟังก์ชันสำหรับจัดการการ submit ฟอร์มลงทะเบียน
  const handleSubmit = async (e) => {
    e.preventDefault(); // ป้องกันการ refresh หน้าเมื่อ submit ฟอร์ม
    setError(''); // ล้างข้อความข้อผิดพลาดเก่า
    setIsSubmitting(true); // เริ่มการ submit

    // ตรวจสอบ input เบื้องต้น
    if (!form.username || !form.email || !form.password || !form.confirmPassword) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      setIsSubmitting(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      setIsSubmitting(false);
      return;
    }
    if (form.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      setIsSubmitting(false);
      return;
    }
    // สามารถเพิ่มการ validate email format ได้ถ้าต้องการ

    // เตรียมข้อมูลที่จะส่ง (ไม่ต้องส่ง confirmPassword)
    const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        navigate('/login'); // Redirect ไปยังหน้าล็อกอิน
      } else {
        setError(data.error || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false); // สิ้นสุดการ submit
    }
  };

  // ส่วน UI ของคอมโพเนนต์
  return (
    <div className="form-container">
      <h2>สมัครสมาชิกใหม่</h2>
      <form onSubmit={handleSubmit} className="form" noValidate>
        <div>
          <label htmlFor="username">ชื่อผู้ใช้ (Username):</label>
          <input
            id="username"
            name="username"
            placeholder="ตั้งชื่อผู้ใช้ของคุณ"
            value={form.username}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="email">อีเมล:</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="กรอกอีเมลที่ใช้งานได้"
            value={form.email}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="password">รหัสผ่าน:</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6} // HTML5 validation
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน:</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="กรอกรหัสผ่านอีกครั้ง"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>

        {error && <p className="error-msg" role="alert">{error}</p>}

        <button type="submit" className='btn-submit' disabled={isSubmitting}>
          {isSubmitting ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
        </button>
      </form>
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <p>มีบัญชีอยู่แล้ว? <Link to="/login" className="link-primary">เข้าสู่ระบบที่นี่</Link></p>
      </div>
    </div>
  );
};

export default Register;
