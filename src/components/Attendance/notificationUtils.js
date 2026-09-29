import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "../../firebase";

export const notifyClassStudents = async (classId, notificationData) => {
  try {
    const db = getFirebaseDb();
    if (!db) return;

    // Canonical roster lives under the canonical class. Legacy data is only a fallback.
    let snap = await getDocs(collection(db, "classes", classId, "classStudents"));
    if (snap.empty) {
      snap = await getDocs(collection(db, "attendanceClasses", classId, "classStudents"));
    }
    
    // Add notifications for each student
    const promises = snap.docs.map(async (docSnap) => {
      const student = docSnap.data();
      if (student.status && student.status !== "active") return;
      const userId = student.userId || student.studentUserId || docSnap.id;
      if (!userId) return; // Skip if student hasn't linked an account

      await addDoc(collection(db, "notifications"), {
        userId,
        classId,
        type: notificationData.type || "general",
        title: notificationData.title || "New Notification",
        message: notificationData.message || "",
        link: notificationData.link || "",
        isRead: false,
        createdAt: serverTimestamp(),
        createdBy: notificationData.createdBy || "teacher"
      });
    });

    await Promise.all(promises);
    console.log(`Notified ${promises.length} students in class ${classId}`);
  } catch (err) {
    console.error("Error notifying students:", err);
  }
};
