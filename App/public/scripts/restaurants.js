console.log("hello world");

const signinLinks = document.querySelectorAll(".toggle-signin")
const newRestauranteur = document.querySelector("#new-restauranteur-create-form");
const existingRestauranteur = document.querySelector("#existing-restauranteur-login");

for (const signinLink of signinLinks) {
  signinLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (existingRestauranteur.style.display === "none") {
      existingRestauranteur.style.display = null;
      newRestauranteur.style.display = "none";
    } else {
      newRestauranteur.style.display = null;
      existingRestauranteur.style.display = "none";
    }
  });
}
