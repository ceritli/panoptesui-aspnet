using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Panoptes.AspNetCore.Demo.Controllers
{
    public class FormController : Controller
    {
        public IActionResult Index()
        {
            var model = new UserRegistrationViewModel();
            return View(model);
        }

        [HttpPost]
        public IActionResult Index(UserRegistrationViewModel model)
        {
            if (ModelState.IsValid)
            {
                // Handle form submission
                ViewBag.Message = "Form başarıyla gönderildi!";
            }
            return View(model);
        }
    }

    public class UserRegistrationViewModel
    {
        [Display(Name = "Kullanıcı Adı")]
        [Required(ErrorMessage = "Kullanıcı adı zorunludur.")]
        public string Username { get; set; }

        [Display(Name = "E-Posta")]
        [Required(ErrorMessage = "E-Posta zorunludur.")]
        [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz.")]
        public string Email { get; set; }

        [Display(Name = "Şifre")]
        [Required(ErrorMessage = "Şifre zorunludur.")]
        [DataType(DataType.Password)]
        public string Password { get; set; }

        [Display(Name = "Ad")]
        public string FirstName { get; set; }

        [Display(Name = "Soyad")]
        public string LastName { get; set; }

        [Display(Name = "Doğum Tarihi")]
        [DataType(DataType.Date)]
        public System.DateTime? DateOfBirth { get; set; }

        [Display(Name = "Bültene Abone Ol")]
        public bool SubscribeToNewsletter { get; set; }
    }
}
