/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('BaseRoute');

// route for doctors
Route.group(() => {
  Route.customResource('', 'CheckupTestController');
})
  .namespace('Admin/Checkup')
  .prefix('admin/checkup-tests')
  .middleware(['auth', 'role:administrator,experiment_admin']);
