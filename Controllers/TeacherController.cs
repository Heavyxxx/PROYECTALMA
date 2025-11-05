using ALMA.Models; // Necesario para los modelos (Student, Teacher, Grade)
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http; // Necesario para acceder a las sesiones
using Microsoft.EntityFrameworkCore; // Necesario para .Include(), .ToListAsync() y .FirstOrDefaultAsync()
using System.Linq; // Necesario para .Where()
using System.Threading.Tasks; // Necesario para operaciones asíncronas (Task, await)
using System;
using ALMA.Data;

namespace ALMA.Controllers
{
    public class TeacherController : Controller
    {
        private readonly AlmaDbContext _context;

        // Constructor para inyectar el contexto de la base de datos
        public TeacherController(AlmaDbContext context)
        {
            _context = context;
        }

        // --- Método de Verificación de Sesión ---
        // Este filtro se usa en todas las acciones para asegurar que el usuario sea un Profesor logueado
        private IActionResult CheckTeacherSession()
        {
            //1. Obtener la sesión
            var teacherId = HttpContext.Session.GetString("TeacherId");

            //2. Si no hay sesión de profesor, redirigir al login
            if (string.IsNullOrEmpty(teacherId))
            {
                return RedirectToAction("Index", "Home");
            }

            //3. Guardar el ID y Nombre del profesor en ViewBag para uso en la Vista
            if (int.TryParse(teacherId, out var parsed))
            {
                ViewBag.TeacherId = parsed;
            }
            else
            {
                return RedirectToAction("Index", "Home");
            }

            ViewBag.TeacherName = HttpContext.Session.GetString("TeacherName");

            return null; // Retorna null si la sesión es válida
        }

        // GET: /Teacher/Dashboard
        public async Task<IActionResult> Dashboard()
        {
            // Verificar la sesión primero
            var sessionCheck = CheckTeacherSession();
            if (sessionCheck != null) return sessionCheck;

            // Cargar la lista de todos los alumnos
            var students = await _context.Students.ToListAsync();

            // Mensaje de éxito si viene de guardar una nota
            if (TempData["SuccessMessage"] != null)
            {
                ViewBag.SuccessMessage = TempData["SuccessMessage"];
            }

            // Devolver la lista de alumnos a la vista
            return View(students);
        }

        // --- GESTIÓN DE NOTAS ---

        // GET: /Teacher/AsignarNota/{matricula}
        public async Task<IActionResult> AsignarNota(string matricula)
        {
            // Verificar la sesión
            var sessionCheck = CheckTeacherSession();
            if (sessionCheck != null) return sessionCheck;

            //1. Buscar al alumno por matrícula
            var student = await _context.Students.FirstOrDefaultAsync(s => s.Matricula == matricula);

            if (student == null)
            {
                // Si el alumno no existe, redirigir al dashboard con un error
                TempData["ErrorMessage"] = $"Error: Alumno con matrícula {matricula} no encontrado.";
                return RedirectToAction("Dashboard");
            }

            //2. Pasar datos del alumno a la vista
            ViewBag.StudentName = $"{student.Nombre} {student.ApellidoPaterno}";
            ViewBag.Matricula = matricula;

            // Devolver la vista del formulario con un Grade inicial
            return View(new Grade { Matricula = matricula, ID_Materia = string.Empty, NombreMateria = string.Empty, Calificacion =0m, Periodo = string.Empty });
        }

        // POST: /Teacher/AsignarNota (Guarda la nota en la BD)
        [HttpPost]
        [ValidateAntiForgeryToken] // Buena práctica de seguridad
        public async Task<IActionResult> AsignarNota(Grade model)
        {
            // Verificar la sesión
            var sessionCheck = CheckTeacherSession();
            if (sessionCheck != null) return sessionCheck;

            //1. Validar si el modelo recibido es válido
            if (ModelState.IsValid)
            {
                //2. Establecer valores necesarios antes de guardar
                // Si no se recibió Periodo, asignar uno por defecto (ejemplo: año-mes)
                if (string.IsNullOrEmpty(model.Periodo))
                {
                    model.Periodo = DateTime.Now.ToString("yyyy-MM");
                }

                // Si no se proporcionó NombreMateria o ID_Materia, dejar como valores vacíos o asignar por defecto
                if (string.IsNullOrEmpty(model.NombreMateria) && string.IsNullOrEmpty(model.ID_Materia))
                {
                    model.NombreMateria = "Materia no especificada";
                }

                //3. Guardar la nueva calificación en la BD
                _context.Grades.Add(model);
                await _context.SaveChangesAsync();

                //4. Mostrar mensaje de éxito y redirigir al dashboard
                TempData["SuccessMessage"] = $"Calificación de {model.Calificacion} guardada exitosamente para el alumno {model.Matricula}.";
                return RedirectToAction("Dashboard");
            }

            //5. Si el modelo no es válido, recargar la vista con errores
            var student = await _context.Students.FirstOrDefaultAsync(s => s.Matricula == model.Matricula);
            if (student != null)
            {
                ViewBag.StudentName = $"{student.Nombre} {student.ApellidoPaterno}";
            }
            ViewBag.Matricula = model.Matricula;

            return View(model);
        }
    }
}
