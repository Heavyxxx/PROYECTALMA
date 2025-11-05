// Mock API usando localStorage para persistencia local (demo)
const SAES_STORAGE_KEY = 'saes_demo_data_v1';

const seed = () => ({
  users: {
    students: [
      { matricula: 'A12345', nombre: 'Juan', apellidoPaterno: 'Perez', contrasena: '12345', programa: 'Ingeniería en Software', correo: 'juan.perez@alma.edu', estatus: 'Activo', credits: 68, gpa: 8.6 },
    ],
    teachers: [
      { id: 100, nombre: 'Maria', apellidoPaterno: 'Lopez', contrasena: '101', area: 'Matemáticas' },
      { id: 101, nombre: 'Carlos', apellidoPaterno: 'Sanz', contrasena: '102', area: 'Programación' }
    ]
  },
  grades: [
    { matricula: 'A12345', materiaId: 'MATE101', nombreMateria: 'Cálculo Diferencial', profesor: 'Maria Lopez', parciales: [9.0,9.5], final: 9.5, periodo: '2024-1', estado: 'Aprobada' },
    { matricula: 'A12345', materiaId: 'PROG201', nombreMateria: 'Introducción a .NET', profesor: 'Carlos Sanz', parciales: [8.0,8.0], final: 8.0, periodo: '2024-1', estado: 'Aprobada' }
  ],
  schedule: [],
  financial: [ { matricula: 'A12345', balance: 0.0, movements: [] } ],
  notifications: []
});

function loadData(){
  const raw = localStorage.getItem(SAES_STORAGE_KEY);
  if(!raw){
    const s = seed();
    localStorage.setItem(SAES_STORAGE_KEY, JSON.stringify(s));
    return s;
  }
  return JSON.parse(raw);
}
function saveData(data){ localStorage.setItem(SAES_STORAGE_KEY, JSON.stringify(data)); }

const api = {
  login: async (username, password) => {
    const data = loadData();
    // teacher by numeric id
    if(!isNaN(Number(username))){
      const t = data.users.teachers.find(x => x.id === Number(username) && x.contrasena === password);
      if(t) return { role: 'teacher', name: t.nombre, id: t.id };
    }
    const s = data.users.students.find(x => x.matricula === username && x.contrasena === password);
    if(s) return { role: 'student', matricula: s.matricula, name: s.nombre };
    throw new Error('Credenciales incorrectas');
  },

  getMe: async (session) => {
    // For demo, session can be object stored by app
    return session || { role: 'anonymous' };
  },

  getSummary: async (matricula) => {
    const data = loadData();
    const s = data.users.students.find(x => x.matricula === matricula);
    if(!s) return null;
    return { matricula: s.matricula, name: s.nombre + ' ' + s.apellidoPaterno, gpa: s.gpa, periodAverage: 9.0, creditsApproved: s.credits, status: s.estatus };
  },

  getGrades: async (matricula, period) => {
    const data = loadData();
    return data.grades.filter(g => g.matricula === matricula && (!period || g.periodo === period));
  },

  // Para docentes: obtener lista de alumnos (simplificada)
  getStudentsForTeacher: async (teacherId) => {
    const data = loadData();
    // Retornamos todos los estudiantes en demo; en implementación real se filtra por asignación
    return data.users.students.map(s => ({ matricula: s.matricula, nombre: s.nombre + ' ' + s.apellidoPaterno }));
  },

  getGroupsForTeacher: async (teacherId) => {
    // Mock: devolver un par de grupos
    return [ { id: 'G1', name: 'Grupo A' }, { id: 'G2', name: 'Grupo B' } ];
  },

  postGrade: async (grade) => {
    const data = loadData();
    data.grades.push(grade);
    saveData(data);
    return grade;
  },

  // Agregar movimiento financiero (demo)
  postFinancialMovement: async (matricula, movement) => {
    const data = loadData();
    let f = data.financial.find(x => x.matricula === matricula);
    if(!f){ f = { matricula, balance:0, movements:[] }; data.financial.push(f); }
    f.movements.push(Object.assign({ date: new Date().toISOString() }, movement));
    f.balance = (f.balance || 0) + (movement.amount || 0);
    saveData(data);
    return f;
  },

  getFinancial: async (matricula) => {
    const data = loadData();
    const f = data.financial.find(x => x.matricula === matricula);
    return f || { balance:0, movements:[] };
  },

  postRequest: async (matricula, body) => {
    const data = loadData();
    const id = 'R' + Math.floor(Math.random()*9000+1000);
    const req = { id, matricula, type: body.type, description: body.description, status: 'submitted', createdAt: new Date().toISOString() };
    data.notifications.push({ matricula, message: `Solicitud ${body.type} recibida (${id})`, date: new Date().toISOString(), read:false });
    saveData(data);
    return req;
  },

  getNotifications: async (matricula) => {
    const data = loadData();
    return data.notifications.filter(n => !matricula || n.matricula === matricula);
  },

  exportGradesCSV: async (matricula) => {
    const grades = await api.getGrades(matricula);
    const rows = [ ['Materia','Profesor','Parciales','Final','Periodo','Estado'] ];
    grades.forEach(g => rows.push([g.nombreMateria, g.profesor, g.parciales.join('|'), g.final, g.periodo, g.estado]));
    const csv = rows.map(r => r.map(c => '"'+(c||'')+'"').join(',')).join('\n');
    return csv;
  }
};

export default api;
