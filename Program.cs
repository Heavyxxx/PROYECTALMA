using ALMA.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Configuración de la base de datos (reemplaza "DefaultConnection" con tu cadena real si es diferente)
builder.Services.AddDbContext<AlmaDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Añadir servicios al contenedor (MVC, Sesiones)
builder.Services.AddControllersWithViews();

// 1. CONFIGURACIÓN DE SESIONES (NECESARIO PARA EL LOGIN Y REDIRECCIÓN)
builder.Services.AddDistributedMemoryCache(); // Necesario para el almacenamiento de sesiones
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30); // Tiempo que durará la sesión
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});


var app = builder.Build();

// Configuración del pipeline de solicitudes HTTP
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

// Configuración de Rutas
app.UseRouting();

// 2. USO DE SESIONES (Debe ir antes de MapControllerRoute)
app.UseSession();

app.UseAuthorization();

// 3. RUTA POR DEFECTO (Asegura que la ruta inicial sea Home/Index)
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();app.Run();