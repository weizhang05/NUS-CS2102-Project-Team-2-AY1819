function register() {
	// Get Values
	var name = document.getElementById('name').value;
	var email = document.getElementById('email').value;
	var pw = document.getElementById('password').value;
	var confirmPw = document.getElementById('confirmPassword').value;
	
	if(pw != confirmPw){
		alert("Password not the same!");
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
}