using Microsoft.AspNetCore.Mvc;
using ALMA.Data;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks; // Necesario para Task
using Microsoft.EntityFrameworkCore; // Necesario para FirstOrDefaultAsync
using ALMA.Models; // Solución para que reconozca LoginViewModel

namespace ALMA.Controllers
{
    public class HomeController : Controller
    {
        private readonly AlmaDbContext _context;

        public HomeController(AlmaDbContext context)
        {
            _context = context;
        }

        // GET: /Home/Index o /
        public IActionResult Index()
        {
            // La ruta principal redirige al Login.
            return RedirectToAction("Login");
        }

        // GET: /Home/Login (Muestra el formulario)
        public IActionResult Login()
        {
            // 1. Verificación de Sesión Activa
            if (HttpContext.Session.GetString("TeacherId") != null)
            {
                return RedirectToAction("Dashboard", "Teacher");
            }
            if (HttpContext.Session.GetString("StudentMatricula") != null)
            {
                return RedirectToAction("Dashboard", "Student");
            }

            // Si no hay sesión, mostrar la vista de Login
            return View();
        }

        // POST: /Home/Login - Maneja el envío del formulario de inicio de sesión
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model)
        {
            if (ModelState.IsValid)
            {
                // ** LÓGICA DE PROFESOR **
                // Se usa model.Username para la Matrícula/ID
                if (int.TryParse(model.Username, out int teacherId) && teacherId >= 100)
                {
                    var teacher = await _context.Teachers
                                        .FirstOrDefaultAsync(t => t.ID_Profesor == teacherId && t.ContrasenaHash == model.Password);

                    if (teacher != null)
                    {
                        // Iniciar Sesión de Profesor
                        HttpContext.Session.SetString("TeacherId", teacher.ID_Profesor.ToString());
                        HttpContext.Session.SetString("TeacherName", teacher.Nombre);
                        return RedirectToAction("Dashboard", "Teacher");
                    }
                }

                // ** LÓGICA DE ALUMNO **
                // Si no es un profesor, se intenta como alumno
                else
                {
                    // Se usa model.Username para la Matrícula
                    var student = await _context.Students
                                        .FirstOrDefaultAsync(s => s.Matricula == model.Username && s.ContrasenaHash == model.Password);

                    if (student != null)
                    {
                        // Iniciar Sesión de Alumno
                        HttpContext.Session.SetString("StudentMatricula", student.Matricula);
                        HttpContext.Session.SetString("StudentName", student.Nombre);
                        return RedirectToAction("Dashboard", "Student");
                    }
                }

                // Si no se encontró ningún usuario (profesor o alumno)
                ModelState.AddModelError(string.Empty, "Credenciales incorrectas.");
            }

            // Si falla la validación o credenciales incorrectas, regresa a la vista de Login
            return View(model);
        }

        // GET: /Home/Logout
        public IActionResult Logout()
        {
            // Borrar todas las variables de sesión
            HttpContext.Session.Clear();

            // Redirigir a la página de inicio de sesión
            return RedirectToAction("Login");
        }
    }
}