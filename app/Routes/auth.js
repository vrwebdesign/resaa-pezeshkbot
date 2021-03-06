const Route = use('Route');
Route.group(() => {
  Route.post('register', 'AuthController.register');
  Route.post('login', 'AuthController.login');
  Route.post('reset_password', 'AuthController.reset_password');
  Route.post('forget_password', 'AuthController.forget_password');
  Route.put('changePassword', 'AuthController.changePassword');
})
  // .middleware(['recaptcha'])
  .prefix('auth');
