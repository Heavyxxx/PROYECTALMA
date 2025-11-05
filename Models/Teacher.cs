using System.ComponentModel.DataAnnotations;

namespace ALMA.Models
{
    public class Teacher
    {
        // ID_Profesor será la clave primaria (Entity Framework la autogenera por convención si se llama 'Id' o 'TeacherId')
        public int ID_Profesor { get; set; }

        public string Nombre { get; set; }
        public string ApellidoPaterno { get; set; }
        public string ApellidoMaterno { get; set; }

        // La contraseña debe estar hasheada en un entorno real
        public string ContrasenaHash { get; set; }

        public string AreaEspecialidad { get; set; }
    }
}