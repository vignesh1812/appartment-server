const { Router } = require("express");
const router = Router();
const authMiddleware=require('../Middleware/authMiddelware')
const {
    createComment,
    createTicket,
    getAllTickets,
    getAssignedTickets,
    getComments,
    getSingleUserTickets,
    getTicketDetail,
    updateAssignedTo,
    updateStatus,
    dateBasedTickets,
    recentlyAssignedTickets,
    StatusTickets,
    ticketCounts,
    assignedTicketCounts

  }=require('../Controller/ticketController')

  router.post('/create-ticket',authMiddleware,createTicket);
  router.get('/',getAllTickets)
  router.get('/assigned',authMiddleware,getAssignedTickets)
  router.get('/assigned/maintain',authMiddleware,getAssignedTickets)
  router.get('/detail/:ticketId',getTicketDetail)
  router.get('/:userId/user',authMiddleware,getSingleUserTickets)
  router.post('/:ticketId/create-comments',authMiddleware,createComment)
  router.get('/:ticketId/comments',getComments)
  router.patch('/:ticketId',updateAssignedTo)
  router.patch('/:ticketId/status',authMiddleware,updateStatus)
  router.post('/datebased/ticket',dateBasedTickets)
  router.get('/recent/assigned',authMiddleware,recentlyAssignedTickets)
  router.get('/status/:statusCode',authMiddleware,StatusTickets)
  router.get('/ticket-counts',ticketCounts)
  router.get('/assigned/ticket-counts',authMiddleware,assignedTicketCounts)

  module.exports=router;