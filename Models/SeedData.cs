using ALMA.Data; // Necesario para AlmaDbContext
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;

namespace ALMA.Models
{
    public static class SeedData
    {
        public static void Initialize(IServiceProvider serviceProvider, AlmaDbContext context)
        {
            // Asegura que la base de datos esté creada y las migraciones aplicadas
            context.Database.Migrate();

            // --- 1. Insertar Alumnos de prueba ---
            if (!context.Students.Any())
            {
                context.Students.Add(
                    new Student
                    {
                        Matricula = "A12345",
                        Nombre = "Juan",
                        ApellidoPaterno = "Perez",
                        ApellidoMaterno = "Gomez",
                        ContrasenaHash = "12345", // En un sistema real se debe hashear
                        ProgramaEstudios = "Ingeniería en Software",
                        CorreoElectronico = "juan.perez@alma.edu",
                        EstatusAcademico = "Activo"
                    }
                );
            }

            // --- 2. Insertar Profesores de prueba ---
            if (!context.Teachers.Any())
            {
                context.Teachers.AddRange(
                    new Teacher
                    {
                        Nombre = "Maria",
                        ApellidoPaterno = "Lopez",
                        ApellidoMaterno = "Ruiz",
                        ContrasenaHash = "101", // Contraseña de prueba
                        AreaEspecialidad = "Matemáticas"
                    },
                    new Teacher
                    {
                        Nombre = "Carlos",
                        ApellidoPaterno = "Sanz",
                        ApellidoMaterno = "Mora",
                        ContrasenaHash = "102",
                        AreaEspecialidad = "Programación"
                    }
                );
            }

            // --- 3. Insertar Calificaciones de prueba ---
            if (!context.Grades.Any())
            {
                context.Grades.AddRange(
                    new Grade
                    {
                        Matricula = "A12345",
                        ID_Materia = "MATE101",
                        NombreMateria = "Cálculo Diferencial",
                        Calificacion = 9.5m,
                        Periodo = "2024-1"
                    },
                    new Grade
                    {
                        Matricula = "A12345",
                        ID_Materia = "PROG201",
                        NombreMateria = "Introducción a .NET",
                        Calificacion = 8.0m,
                        Periodo = "2024-1"
                    }
                );
            }

            context.SaveChanges();
        }
    }
}