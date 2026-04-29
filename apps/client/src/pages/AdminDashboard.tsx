import { useEffect, useMemo, useState } from "react";
import { Button, Input } from "@repo/ui";
import { api, type ApiResult, type UserStatus } from "../api/client";
import AppShell from "../components/AppShell";
import { StatusPanel } from "../components/StatusPanel";

type Department = {
  id: string;
  name: string;
  _count?: { classes?: number; users?: number };
};

type ClassRecord = {
  id: string;
  name: string;
  departmentId: string;
  teacherId?: string | null;
  department?: { id: string; name: string };
  teacher?: { id: string; name: string; email?: string | null } | null;
  _count?: { students?: number };
};

type AdminUser = {
  id: string;
  name: string;
  email?: string | null;
  rollNumber?: string | null;
  role: "TEACHER" | "STUDENT";
  status: UserStatus;
  classId?: string | null;
  departmentId?: string | null;
};

type RagType = "GENERAL" | "DEPARTMENT" | "TEACHER";

type RagDocument = {
  id: string;
  title: string;
  content: string;
  preview?: string;
  type: RagType;
  createdAt: string;
};

const inputClass = "app-input";
const selectClass = "app-input h-10 rounded-md px-3 text-sm";
const statusOptions: { value: UserStatus; label: string }[] = [
  { value: "NOT_REGISTERED", label: "Not approved" },
  { value: "ACTIVE", label: "Approved" },
  { value: "BLOCKED", label: "Blocked" },
];
const ragTypeOptions: { value: RagType; label: string }[] = [
  { value: "GENERAL", label: "General" },
  { value: "DEPARTMENT", label: "Department" },
  { value: "TEACHER", label: "Teacher only" },
];

function readList<T>(result: ApiResult) {
  return ((result.data as { data?: T[] } | undefined)?.data ?? []) as T[];
}

function ids(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminDashboard() {
  const [result, setResult] = useState<ApiResult>();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [teachers, setTeachers] = useState<AdminUser[]>([]);
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [ragDocuments, setRagDocuments] = useState<RagDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [department, setDepartment] = useState("");
  const [className, setClassName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [teacher, setTeacher] = useState({ name: "", email: "", password: "" });
  const [student, setStudent] = useState({
    name: "",
    rollNumber: "",
    email: "",
    password: "",
    classId: "",
    departmentId: "",
    status: "NOT_REGISTERED" as UserStatus,
  });
  const [classStudents, setClassStudents] = useState({ classId: "", studentIds: "" });
  const [teacherAssign, setTeacherAssign] = useState({ classId: "", teacherId: "" });
  const [studentStatus, setStudentStatus] = useState({
    studentId: "",
    status: "ACTIVE" as UserStatus,
  });
  const [ragForm, setRagForm] = useState({
    title: "",
    content: "",
    type: "GENERAL" as RagType,
  });
  const [isSavingRag, setIsSavingRag] = useState(false);

  const pendingStudents = useMemo(
    () => students.filter((item) => item.status !== "ACTIVE"),
    [students],
  );

  async function refreshAdminData() {
    setIsLoading(true);
    const [departmentResult, classResult, teacherResult, studentResult, ragResult] = await Promise.all([
      api.listDepartments(),
      api.listClasses(),
      api.listTeachers(),
      api.listStudents(),
      api.listRagDocuments(),
    ]);

    setDepartments(readList<Department>(departmentResult));
    setClasses(readList<ClassRecord>(classResult));
    setTeachers(readList<AdminUser>(teacherResult));
    setStudents(readList<AdminUser>(studentResult));
    setRagDocuments(readList<RagDocument>(ragResult));
    setIsLoading(false);

    const failed = [departmentResult, classResult, teacherResult, studentResult, ragResult].find((item) => !item.ok);
    if (failed) {
      setResult(failed);
    }
  }

  async function submit(action: () => Promise<ApiResult>, after?: () => void) {
    const response = await action();
    setResult(response);

    if (response.ok) {
      after?.();
      await refreshAdminData();
    }
  }

  async function saveRagDocument() {
    setIsSavingRag(true);
    const response = await api.createRagDocument({
      title: ragForm.title.trim(),
      content: ragForm.content.trim(),
      type: ragForm.type,
    });
    setResult(response);
    setIsSavingRag(false);

    if (response.ok) {
      setRagForm({ title: "", content: "", type: "GENERAL" });
      await refreshAdminData();
    }
  }

  async function removeRagDocument(documentId: string) {
    const response = await api.deleteRagDocument(documentId);
    setResult(response);

    if (response.ok) {
      await refreshAdminData();
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      refreshAdminData().catch((error) => {
        setIsLoading(false);
        setResult({
          ok: false,
          status: 0,
          data: error instanceof Error ? error.message : "Could not load admin data",
        });
      });
    });
  }, []);

  return (
    <AppShell
      title="Admin Control"
      subtitle="Only admins can create departments, create classes, assign teachers, manage student class membership, and approve or block students."
    >
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Departments" value={departments.length} />
        <Metric label="Classes" value={classes.length} />
        <Metric label="Teachers" value={teachers.length} />
        <Metric label="Pending Students" value={pendingStudents.length} />
      </div>

      <section className="app-card mb-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">College knowledge base</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Add official college information. The API splits it into chunks, embeds it with Gemini, and uses it for assistant answers.
            </p>
          </div>
          <span className="rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
            {ragDocuments.length} chunks
          </span>
        </div>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <Input
              className={inputClass}
              placeholder="Title"
              value={ragForm.title}
              onChange={(e) => setRagForm({ ...ragForm, title: e.target.value })}
            />
            <select
              className={selectClass}
              value={ragForm.type}
              onChange={(e) => setRagForm({ ...ragForm, type: e.target.value as RagType })}
            >
              {ragTypeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="app-input min-h-40 rounded-md px-3 py-2 text-sm leading-6"
            placeholder="Paste college policies, department notes, office hours, fees, placement info, exam rules, or other official data."
            value={ragForm.content}
            onChange={(e) => setRagForm({ ...ragForm, content: e.target.value })}
          />
          <Button
            className="app-success-button w-full sm:w-auto"
            disabled={isSavingRag || !ragForm.title.trim() || !ragForm.content.trim()}
            onClick={saveRagDocument}
          >
            {isSavingRag ? "Embedding..." : "Add to assistant"}
          </Button>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {ragDocuments.length ? (
            ragDocuments.map((item) => (
              <section key={item.id} className="app-card-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{item.title}</h3>
                    <p className="mt-1 text-xs text-zinc-500">{item.type}</p>
                  </div>
                  <Button
                    className="app-muted-button h-8 px-3 text-xs"
                    onClick={() => removeRagDocument(item.id)}
                  >
                    Delete
                  </Button>
                </div>
                <p className="mt-3 line-clamp-4 text-xs leading-5 text-zinc-400">{item.preview ?? item.content}</p>
              </section>
            ))
          ) : (
            <p className="text-sm text-zinc-400">No assistant knowledge added yet.</p>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="app-card p-5">
          <h2 className="font-semibold">Create department</h2>
          <div className="mt-4 grid gap-3">
            <Input className={inputClass} placeholder="Department name" value={department} onChange={(e) => setDepartment(e.target.value)} />
            <Button className="app-primary-button" onClick={() => submit(() => api.createDepartment({ name: department.trim() }), () => setDepartment(""))}>
              Save department
            </Button>
          </div>
        </section>

        <section className="app-card p-5">
          <h2 className="font-semibold">Create class</h2>
          <div className="mt-4 grid gap-3">
            <Input className={inputClass} placeholder="Class name" value={className} onChange={(e) => setClassName(e.target.value)} />
            <select className={selectClass} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">Select department</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <Button className="app-primary-button" onClick={() => submit(() => api.createClass({ name: className.trim(), departmentId }), () => {
              setClassName("");
              setDepartmentId("");
            })}>
              Save class
            </Button>
          </div>
        </section>

        <section className="app-card p-5">
          <h2 className="font-semibold">Create teacher</h2>
          <div className="mt-4 grid gap-3">
            <Input className={inputClass} placeholder="Name" value={teacher.name} onChange={(e) => setTeacher({ ...teacher, name: e.target.value })} />
            <Input className={inputClass} type="email" placeholder="Email" value={teacher.email} onChange={(e) => setTeacher({ ...teacher, email: e.target.value })} />
            <Input className={inputClass} type="password" placeholder="Temporary password" value={teacher.password} onChange={(e) => setTeacher({ ...teacher, password: e.target.value })} />
            <Button className="app-primary-button" onClick={() => submit(() => api.createTeacher({
              name: teacher.name.trim(),
              email: teacher.email.trim(),
              password: teacher.password,
            }), () => setTeacher({ name: "", email: "", password: "" }))}>
              Save teacher
            </Button>
          </div>
        </section>

        <section className="app-card p-5">
          <h2 className="font-semibold">Add student</h2>
          <div className="mt-4 grid gap-3">
            <Input className={inputClass} placeholder="Name" value={student.name} onChange={(e) => setStudent({ ...student, name: e.target.value })} />
            <Input className={inputClass} placeholder="Roll number" value={student.rollNumber} onChange={(e) => setStudent({ ...student, rollNumber: e.target.value })} />
            <Input className={inputClass} type="email" placeholder="Email optional" value={student.email} onChange={(e) => setStudent({ ...student, email: e.target.value })} />
            <Input className={inputClass} type="password" placeholder="Password optional" value={student.password} onChange={(e) => setStudent({ ...student, password: e.target.value })} />
            <select className={selectClass} value={student.status} onChange={(e) => setStudent({ ...student, status: e.target.value as UserStatus })}>
              {statusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select className={selectClass} value={student.departmentId} onChange={(e) => setStudent({ ...student, departmentId: e.target.value })}>
              <option value="">Department optional</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select className={selectClass} value={student.classId} onChange={(e) => setStudent({ ...student, classId: e.target.value })}>
              <option value="">Class optional</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <Button className="app-primary-button" onClick={() => submit(() => api.createStudent({
              name: student.name.trim(),
              rollNumber: student.rollNumber.trim(),
              email: student.email.trim() || undefined,
              password: student.password || undefined,
              status: student.status,
              departmentId: student.departmentId || undefined,
              classId: student.classId || undefined,
            }), () => setStudent({
              name: "",
              rollNumber: "",
              email: "",
              password: "",
              classId: "",
              departmentId: "",
              status: "NOT_REGISTERED",
            }))}>
              Save student
            </Button>
          </div>
        </section>

        <section className="app-card p-5">
          <h2 className="font-semibold">Assign students to class</h2>
          <div className="mt-4 grid gap-3">
            <select className={selectClass} value={classStudents.classId} onChange={(e) => setClassStudents({ ...classStudents, classId: e.target.value })}>
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <textarea
              className="app-input min-h-24 rounded-md px-3 py-2 text-sm"
              placeholder="Student IDs or roll numbers, comma or line separated"
              value={classStudents.studentIds}
              onChange={(e) => setClassStudents({ ...classStudents, studentIds: e.target.value })}
            />
            <Button className="app-primary-button" onClick={() => submit(() => api.addStudentsToClass(classStudents.classId, { studentIds: ids(classStudents.studentIds) }), () => setClassStudents({ classId: "", studentIds: "" }))}>
              Assign students
            </Button>
          </div>
        </section>

        <section className="app-card p-5">
          <h2 className="font-semibold">Assign teacher to class</h2>
          <div className="mt-4 grid gap-3">
            <select className={selectClass} value={teacherAssign.classId} onChange={(e) => setTeacherAssign({ ...teacherAssign, classId: e.target.value })}>
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select className={selectClass} value={teacherAssign.teacherId} onChange={(e) => setTeacherAssign({ ...teacherAssign, teacherId: e.target.value })}>
              <option value="">Select teacher</option>
              {teachers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.email ? `(${item.email})` : ""}
                </option>
              ))}
            </select>
            <Button className="app-primary-button" onClick={() => submit(() => api.assignTeacherToClass(teacherAssign.classId, { teacherId: teacherAssign.teacherId }), () => setTeacherAssign({ classId: "", teacherId: "" }))}>
              Assign teacher
            </Button>
          </div>
        </section>

        <section className="app-card p-5 lg:col-span-2">
          <h2 className="font-semibold">Student approval status</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <select className={selectClass} value={studentStatus.studentId} onChange={(e) => setStudentStatus({ ...studentStatus, studentId: e.target.value })}>
              <option value="">Select student</option>
              {students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.rollNumber ? `(${item.rollNumber})` : ""} - {item.status}
                </option>
              ))}
            </select>
            <select className={selectClass} value={studentStatus.status} onChange={(e) => setStudentStatus({ ...studentStatus, status: e.target.value as UserStatus })}>
              {statusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <Button className="app-success-button" onClick={() => submit(() => api.updateStudentStatus(studentStatus.studentId, { status: studentStatus.status }))}>
              Update status
            </Button>
          </div>
        </section>
      </div>

      <section className="app-card mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Admin data</h2>
          <Button className="app-muted-button" onClick={() => refreshAdminData()}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <DataList title="Departments" items={departments.map((item) => `${item.name} - ${item.id}`)} />
          <DataList title="Classes" items={classes.map((item) => `${item.name} - ${item.id} - ${item.department?.name ?? item.departmentId}`)} />
          <DataList title="Teachers" items={teachers.map((item) => `${item.name} - ${item.id}`)} />
          <DataList title="Students" items={students.map((item) => `${item.name} - ${item.rollNumber ?? item.id} - ${item.status}`)} />
        </div>
      </section>

      <StatusPanel result={result} />
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <section className="app-card p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </section>
  );
}

function DataList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="app-card-soft p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <div className="mt-3 grid max-h-56 gap-2 overflow-auto text-xs leading-5 text-zinc-400">
        {items.length ? items.map((item) => <code key={item}>{item}</code>) : <span>No records yet.</span>}
      </div>
    </section>
  );
}
