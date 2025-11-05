using ALMA.Models; // ¡Necesario para acceder a Student, Teacher, Grade!
using Microsoft.EntityFrameworkCore;

namespace ALMA.Data
{
    public class AlmaDbContext : DbContext
    {
        public AlmaDbContext(DbContextOptions<AlmaDbContext> options)
            : base(options)
        {
        }

        // DbSets que representan las tablas de la base de datos
        public DbSet<Student> Students { get; set; }
        public DbSet<Teacher> Teachers { get; set; }
        public DbSet<Grade> Grades { get; set; }

        // Puedes agregar aquí la configuración del modelo si es necesario
    }
}