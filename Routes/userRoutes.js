const { Router } = require("express");
const router = Router();
const authMiddleware=require('../Middleware/authMiddelware')
const {
  deleteUser,
  getAllUsers,
  getSingleUser,
  getSubroleUser,
  loginUser,
  registerUser,
  updateUser,
  changeProfile,
  getRoleBasedUsers,
  addMaintainerRole,
  getMaintainerRoles,
  deleteMaintainerRole
} = require("../Controller/userController");

router.post('/register',registerUser);
router.post('/login',loginUser)
router.get('/',getAllUsers);
router.get('/:userId',getSingleUser)
router.get('/role/:subrole',getSubroleUser)
router.patch('/edit-user/:userId',authMiddleware,updateUser)
router.delete('/delete-user/:userId',authMiddleware,deleteUser)
router.post('/avator/change-profile',authMiddleware,changeProfile)
router.get('/users/:usersRole',getRoleBasedUsers)
router.post('/maintainence/add',addMaintainerRole)
router.get('/maintainence/get',getMaintainerRoles)
router.delete('/maintainence/:roleId/delete',deleteMaintainerRole)

module.exports=router;
