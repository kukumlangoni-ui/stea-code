import { useParams, useNavigate } from "react-router-dom";
import AttendanceSubmissionModal from "../../components/Attendance/AttendanceSubmissionModal";

export default function AttendanceJoinPage() {
  const { code } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/classroom/student-dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#05060a" }}>
      <AttendanceSubmissionModal 
        initialCode={code} 
        onClose={handleClose}
        onSuccess={() => {
          // Modal will auto-close and call onClose after showing success screen
        }}
      />
    </div>
  );
}
