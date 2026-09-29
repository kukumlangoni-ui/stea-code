import { addDoc, collection, doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const CLASSROOM_ORIGIN = "https://classroom.stea.africa";

export function normalizeClassCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return /^[A-Z0-9]{6,}$/.test(code) ? code : "";
}

export function buildClassJoinLink(code) {
  const normalized = normalizeClassCode(code);
  return normalized ? `${CLASSROOM_ORIGIN}/classroom/join/${normalized}` : CLASSROOM_ORIGIN;
}

function generateClassCode() {
  let code = "";
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

async function reserveCode(db, classRef, teacherId, classData, preferredCode = "") {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = normalizeClassCode(preferredCode) || generateClassCode();
    const reservationRef = doc(db, "classCodes", code);
    let reserved = false;
    let joinUrl = buildClassJoinLink(code);

    console.info("CREATE_CLASS_STEP_1", { classId: classRef.id, attempt: attempt + 1 });

    await runTransaction(db, async (transaction) => {
      const reservation = await transaction.get(reservationRef);
      if (reservation.exists() && reservation.data().classId !== classRef.id) {
        return;
      }

      transaction.set(classRef, {
        ...classData,
        classCode: code,
        joinCode: code,
        code,
        joinUrl,
      }, { merge: true });
      transaction.set(reservationRef, {
        classId: classRef.id,
        teacherId,
        classCode: code,
        joinCode: code,
        code,
        joinUrl,
        className: classData?.className || classData?.name || "",
        subject: classData?.subject || "",
        teacherName: classData?.teacherName || "",
        schoolName: classData?.schoolName || "",
        requireApproval: Boolean(classData?.requireApproval),
        status: classData?.status || "active",
        deleted: Boolean(classData?.deleted),
        createdAt: reservation.exists() ? reservation.data().createdAt : serverTimestamp(),
      }, { merge: true });
      reserved = true;
    });

    if (reserved) {
      console.info("CREATE_CLASS_CODE_CREATED", { classId: classRef.id, code });
      console.info("CREATE_CLASS_DOC_CREATED", { classId: classRef.id, recovered: false });
      return { code, joinUrl, classRef };
    }
    preferredCode = "";
  }

  throw new Error("Unable to reserve a unique class code. Please try again.");
}

export async function createClassWithUniqueCode(db, classData) {
  const classRef = doc(collection(db, "classes"));
  try {
    return await reserveCode(db, classRef, classData.teacherId, classData);
  } catch (error) {
    console.error("CREATE_CLASS_CATCH_ERROR", { classId: classRef.id, error });

    // A transaction acknowledgement can fail after the server committed it. Verify the
    // canonical document before allowing callers to present a fatal create error.
    try {
      const existingClass = await getDoc(classRef);
      if (existingClass.exists()) {
        const data = existingClass.data();
        const code = normalizeClassCode(data.classCode || data.joinCode || data.code);
        if (code) {
          console.warn("CREATE_CLASS_DOC_CREATED", { classId: classRef.id, recovered: true });
          return { code, joinUrl: buildClassJoinLink(code), classRef, recovered: true };
        }
      }
    } catch (lookupError) {
      console.error("CREATE_CLASS_CATCH_ERROR", { classId: classRef.id, step: "verify_created_class", error: lookupError });
    }

    throw error;
  }
}

export async function runOptionalClassSetup(db, result, actor) {
  console.info("[Classroom] legacy sync skipped: classes is canonical", { classId: result.classRef.id });
  console.info("[Classroom] refresh scheduled through Firestore snapshot", { classId: result.classRef.id });

  try {
    await addDoc(collection(db, "audit_logs"), {
      action: "create_class",
      entity: "classes",
      entityId: result.classRef.id,
      classId: result.classRef.id,
      performedByUid: actor.uid,
      performedByEmail: actor.email || "",
      timestamp: serverTimestamp(),
      source: "classroom_create",
    });
    console.info("[Classroom] audit log success", { classId: result.classRef.id });
    return { warning: "" };
  } catch (error) {
    console.warn("[Classroom] audit log failed; class remains created", { classId: result.classRef.id, error });
    return { warning: "Class created, but some setup steps need sync." };
  }
}

export async function ensureClassCode(db, classId, classData) {
  if (!classId || !classData?.teacherId) return null;
  const classRef = doc(db, "classes", classId);
  return reserveCode(db, classRef, classData.teacherId, classData, classData.classCode || classData.joinCode);
}
