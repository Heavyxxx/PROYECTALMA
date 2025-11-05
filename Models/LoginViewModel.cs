using System.ComponentModel.DataAnnotations;

namespace ALMA.Models
{
    // Modelo usado para capturar los datos del formulario de inicio de sesión
    public class LoginViewModel
    {
        [Required(ErrorMessage = "La matrícula o ID es obligatoria.")]
        [Display(Name = "Usuario (Matrícula / ID)")]
        public string Username { get; set; }

        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        [DataType(DataType.Password)]
        [Display(Name = "Contraseña")]
        public string Password { get; set; }
    }
}
