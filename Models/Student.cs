using System.ComponentModel.DataAnnotations;

namespace ALMA.Models
{
    public class Student
    {
        // Usamos Key para definir la Matricula como la clave primaria
        [Key]
        public string Matricula { get; set; }

        public string Nombre { get; set; }
        public string ApellidoPaterno { get; set; }
        public string ApellidoMaterno { get; set; }

        // La contraseña debe estar hasheada en un entorno real
        public string ContrasenaHash { get; set; }

        public string ProgramaEstudios { get; set; }
        public string CorreoElectronico { get; set; }
        public string EstatusAcademico { get; set; }
    }
}