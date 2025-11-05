using System.ComponentModel.DataAnnotations;

namespace ALMA.Models
{
    public class Grade
    {
        // ID_Calificacion será la clave primaria. Se usa para identificar cada registro de calificación.
        public int ID_Calificacion { get; set; }

        // Claves foráneas (aunque no las definamos explícitamente con [ForeignKey], EF Core las usa)
        public string Matricula { get; set; }
        public string ID_Materia { get; set; }

        public string NombreMateria { get; set; }
        public decimal Calificacion { get; set; } // Usamos decimal para precisión en calificaciones
        public string Periodo { get; set; }
    }
}