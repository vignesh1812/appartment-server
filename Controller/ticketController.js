const HttpError = require("../Model/errorModel");
const User = require("../Model/userModel");
const Comments = require("../Model/commentModel");
const sendMail = require("../mailer");
const Ticket = require("../Model/ticketModel");
const { v4: uuid } = require("uuid");
const path = require("path");
const fs = require("fs");
const sendmail = require("../mailer");
// const mailOptions = {
//   from: 'your_email@gmail.com',
//   to: 'recipient_email@example.com',
//   subject: 'New Ticket Created',
//   text: `A new ticket has been created:\n\n${JSON.stringify(ticket, null, 2)}`
// };
// // --------------------------------CREATE TICKET--------------------------------
// METHOD-POST
// PROTECTED
// API-ENDPOINT:api/tickets/create-ticket

const createTicket = async (req, res, next) => {
  const email = await req.user.email;
  try {
    const generateUniqueNumber = () => {
      const prefix = "TKT-";
      const min = 1000; // Minimum 4-digit number
      const max = 99999; // Maximum 4-digit number

      let generatedNumber;
      generatedNumber = Math.floor(Math.random() * (max - min + 1)) + min;
      return `${prefix}${generatedNumber}`;
    };
    const ticketNo = generateUniqueNumber();
    let filename;
    let newTicket;
    let newFilename;
    const { title, description, category } = await req.body;
    const todayDate = new Date().toISOString().split("T")[0];
    const uploadPath = path.join(__dirname, "..", "uploads", todayDate);
    if (!title || !description || !category) {
      return next(new HttpError("Please fill all the Details", 422));
    }
    if(category==="nocategory"){
      return next(new HttpError("Please Select Issue Category", 422));
    }
    if (title.length < 8) {
      return next(new HttpError("Title contains Atleast 12 Characters", 422));
    }
    if (description.length < 12) {
      return next(
        new HttpError("Description contains Atleast 12 Characters", 422)
      );
    }
    if (!req.files) {
      newTicket = await Ticket.create({
        title: title,
        description: description,
        category: category,
        userId: req.user.id,
        ticketNo: ticketNo,
      });
      let mailOptions = {
        from: "vigneshcs1812@gmail.com",
        to: email,
        cc: "vigneshofficial1812@gmail.com",
        subject: `New Ticket Created-${newTicket.ticketNo}`,
        text: `A new ticket :${newTicket.ticketNo} has been created successFully`,
        html: `<h1>Thank You</h1>
        </br>
        <h3>A new ticket :${newTicket.ticketNo} has been created successFully</h3>
        </br>
        <small>By Appartment Maintainence</small>
        `,
      };

      await sendmail(mailOptions);

      res
        .status(200)
        .json(`Ticket ${newTicket.ticketNo} Created successFully `);
    } else {
      const { file } = await req.files;
      if (file.size > 5000000) {
        return next(new HttpError("File Should Be lessthan 5mb", 422));
      }

      filename = await file.name;
      let splittedFileName = await filename.split(".");
      newFilename =
        ticketNo +
        uuid() +
        "." +
        (await splittedFileName[splittedFileName.length - 1]);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      file.mv(path.join(uploadPath, newFilename), async (err) => {
        if (err) {
          return next(new HttpError(err));
        } else {
          newTicket = await Ticket.create({
            title: title,
            description: description,
            category: category,
            userId: req.user.id,
            ticketNo: ticketNo,
            image: newFilename,
          });
          if (!newTicket) {
            return next(
              new HttpError("Something Went Wrong.Please try again!", 422)
            );
          }
          let mailOptions = {
            from: "vigneshcs1812@gmail.com",
            to: email,
            cc: "vigneshofficial1812@gmail.com",
            subject: `New Ticket Created-${newTicket.ticketNo}`,
            text: `A new ticket :${newTicket.ticketNo} has been created successFully`,
            html: `<h1>Thank You</h1>
            </br>
            <h3>A new ticket :${newTicket.ticketNo} has been created successFully</h3>
            </br>
            <small>By Appartment Maintainence</small>
            `,
          };

          await sendmail(mailOptions);
          res
            .status(200)
            .json(`Ticket ${newTicket.ticketNo} Created successFully `);
        }
      });
    }
  } catch (error) {
    return next(new HttpError("Ticket Registration Failed!", 500));
  }
};

// --------------------------------GET TICKET DETAIL--------------------------------
// METHOD-GET
// UN-PROTECTED
// API-ENDPOINT:api/tickets/:ticketId

const getTicketDetail = async (req, res, next) => {
  try {
    const { ticketId } = await req.params;
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return next(new HttpError("No Ticket Found", 404));
    }
    res.status(200).json(ticket);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// --------------------------------GET ALL TICKETS--------------------------------
// METHOD-GET
// UN-PROTECTED
// API-ENDPOINT:api/tickets/
const getAllTickets = async (req, res, next) => {
  try {
    const allTickets = await Ticket.find().sort({ createdAt: -1 });
    if (!allTickets) {
      return next(new HttpError("No tickets Found", 404));
    }
    res.status(200).json(allTickets);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// --------------------------------GET USER BASED TICKETS--------------------------------
// METHOD-GET
// UN-PROTECTED
// API-ENDPOINT:api/tickets/:userId/user

const getSingleUserTickets = async (req, res, next) => {
  try {
    const { userId } = await req.params;
    const userTickets = await Ticket.find({ userId }).sort({ createdAt: -1 });
    if (!userTickets) {
      return next(new HttpError("No Tickets Found", 404));
    }
    res.status(201).json(userTickets);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// --------------------------------UPDATE TICKET STATUS--------------------------------
// METHOD-PATCH
// PROTECTED
// API-ENDPOINT:api/tickets/:ticketId/status

const updateStatus = async (req, res, next) => {
  try {
    const { ticketId } = await req.params;
    const roles = ["admin", "superadmin"];
    if (!roles.includes(req.user.role)) {
      return next(new HttpError("Admin Have Only Rights to Close Ticket", 403));
    }
    const ticketStatus = await Ticket.findByIdAndUpdate(
      ticketId,
      { status: "closed" },
      { new: true }
    );
    const UserEmail = await User.findById(ticketStatus.userId).select('email');
    // console.log(UserEmail);
    if (!ticketStatus) {
      return next(new HttpError("Something Went wrong!", 404));
    }
    const mailOptions = {
      from: "vigneshcs1812@gmail.com",
      to: UserEmail.email,
      cc: "vigneshofficial1812@gmail.com",
      subject: `Ticket Closed - ${ticketStatus.ticketNo}`,
      text: `ticket :${ticketStatus.ticketNo} has been Closed successFully`,
      html: `<h1>Thank You</h1>
      </br>
      <h4>${ticketStatus.ticketNo}-Issue Solved</h4>
      </br>
      <h3> Ticket :${ticketStatus.ticketNo} has been Closed successFully</h3>
      </br>
      <a href='http://localhost:5173/login'>View Ticket Status & Details</a>
      </br>
      <small>By Appartment Maintainence</small>
      `,
    };
    await sendMail(mailOptions);
    res.status(200).json(`${ticketStatus.ticketNo} Closed Successfully`);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// --------------------------------ASSIGN TICKET TO MAINTAINENCE MEMBER--------------------------------
// METHOD-PATCH
// PROTECTED
// API-ENDPOINT:api/tickets/:ticketId
const updateAssignedTo = async (req, res, next) => {
  try {
    const { ticketId } = await req.params;

    const { assign } = await req.body;
    if (!ticketId) {
      return next(new HttpError("NO ticketID Refrence", 422));
    }
    if (!assign) {
      return next(
        new HttpError("Please Select Maintainer to Assign Ticket", 422)
      );
    }
    if (assign==="select maintainer") {
      return next(
        new HttpError("Please Select Maintainer to Assign Ticket", 422)
      );
    }
    const assignedMember = await User.findById(assign);
    if (!assignedMember) {
      return next(new HttpError("No assigned member,please check", 422));
    }

    const assignTicket = await Ticket.findByIdAndUpdate(ticketId, {
      assignedTo: assign,
      assignedMember: assignedMember.username,
      status: "inprogress",
    });
    if (!assignTicket) {
      return next(new HttpError("Something Went Wrong!", 422));
    }

    const ticketUser = await User.findById(assignTicket.userId);
    // console.log(ticketUser);

    const AssignedCC = ["vigneshofficial1812@gmail.com"];
    AssignedCC.push(ticketUser.email);
    const mailOptions = {
      from: "vigneshcs1812@gmail.com",
      to: assignedMember.email,
      cc: AssignedCC,
      subject: `Ticket Assigned-${assignTicket.ticketNo}`,
      text: `Ticket:${assignTicket.ticketNo} has been Assigned successFully to ${assignedMember.username} `,
      html: `<h1>Ticket Assigned Sucessfully</h1>
      </br>
      <h3>Ticket:${assignTicket.ticketNo} has been Assigned successFully to ${assignedMember.username}</h3>
      </br>
      <p>Click to Comment,if Anything Want to Say Regarding Ticket! </p>
      </br>
      <h5><a href='http://localhost:5173/login'>Comment Now!</a></h5>
      </br>
      <small>By Appartment Maintainence</small>
      `,
    };
    await sendmail(mailOptions);
    res
      .status(200)
      .json(`Ticket Assigned Sucessfully to ${assignedMember.username}`);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// --------------------------------GET ASSIGNED TICKET WITH maintainence ID--------------------------------
// METHOD-GET
// UN-PROTECTED
// API-ENDPOINT:api/ticket/:assignedto

const getAssignedTickets = async (req, res, next) => {
  try {
    const getAssignTicket = await Ticket.find({ assignedTo: req.user.id }).sort(
      {
        createdAt: -1,
      }
    );
    if (!getAssignTicket.length > 0) {
      return next(new HttpError("No Tickets Assigned !", 422));
    }
    res.status(200).json(getAssignTicket);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// --------------------------------CREATE TICKET COMMENTS--------------------------------
// METHOD-POST
// PROTECTED
// API-ENDPOINT:api/tickets/:ticketId/comment

const createComment = async (req, res, next) => {
  try {
    const { ticketId } = await req.params;
    const { content } = await req.body;
    // const { emailid } = await req.user;
    let savedComments;

    if (!content.length) {
      return next(
        new HttpError("Please write Comment before Creating the comment", 422)
      );
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return next(new HttpError("Ticket Not Found", 404));
    }
  if(!req.user.subrole.length){
    savedComments = await Comments.create({
      ticketId: ticketId,
      userRole: req.user.role,
      userId: req.user.id,
      content: content,
    })
  }else{
    savedComments = await Comments.create({
      ticketId: ticketId,
      userRole: req.user.role,
      subRole:req.user.subrole,
      userId: req.user.id,
      content: content,
    })
  }
    if (!savedComments) {
      return next(new HttpError("Something Went Wrong!"));
    }

    const ticketComment = await Ticket.updateOne(
      { _id: ticket._id },
      { $push: { comments: savedComments._id } }
    );
    const commentCC = ["vigneshofficial1812@gmail.com"];
    if (ticket.assignedTo) {
      const assignedMembermail = await User.findById(ticket.assignedTo).select("email")
      // console.log(assignedMembermail);
      // console.log(ticket);
      if (assignedMembermail,"1") {
        commentCC.push(assignedMembermail.email);
      }
    }
    const ticketUser = await User.findById(ticket.userId).select("email")
    // console.log(ticketUser,"2");
    commentCC.push(ticketUser.email);

    const mailOptions = {
      from: "vigneshcs1812@gmail.com",
      to: commentCC,
      cc: req.user.emailid,
      subject: `${req.user.name} Commented-${ticket.ticketNo}`,
      text: `${req.user.name} Commented on ${ticket.ticketNo} !`,
      html: `<h2>Hey,${req.user.name} created a New Comment! for ${ticket.ticketNo} </h2>
      </br>
      <h3>Click the below Link to View comments of ${ticket.ticketNo}(Ticket)</h3>
      </br>
      <a href='http://localhost:5173/login'>View Comment</a>
      </br>
      <small>By Appartment Maintainence</small>
      `,
    };
    await sendMail(mailOptions);
    res.status(201).json(ticket);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// --------------------------------GET TICKET COMMENTS--------------------------------
// METHOD-GET
// UN-PROTECTED
// API-ENDPOINT:api/tickets/:ticketId/comment

const getComments = async (req, res, next) => {
  try {
    const { ticketId } = await req.params;
    const ticket = await Ticket.findById(ticketId);

    // Check if the ticket exists
    if (!ticket) {
      return next(new HttpError("Ticket not found", 404));
    }

    const commentIds = ticket.comments;

    const comments = await Comments.find({ _id: { $in: commentIds } }).sort({
      createdAt: -1,
    });

    res.status(200).json(comments);
  } catch (error) {
    return next(new HttpError(error));
  }
};
const dateBasedTickets = async (req, res, next) => {
  const { startDate, endDate, status } = await req.body;
  let result;
  try {
    if (!startDate || !endDate) {
      return next(new HttpError("Start and EndDate Required", 422));
    }

    const customStartDate = new Date(startDate);
    const customEndDate = new Date(endDate);
    customStartDate.setHours(0, 0, 0, 0);
    customEndDate.setHours(23, 59, 59, 999);

    if (status === "all") {
      result = await Ticket.find({
        updatedAt: { $gte: customStartDate, $lte: customEndDate },
      });
    } else {
      result = await Ticket.find({
        updatedAt: { $gte: customStartDate, $lte: customEndDate },
        status: status,
      });
    }

    if (!result) {
      return next(new HttpError("Nothing Found", 422));
    }
    res.status(200).json(result);
  } catch (error) {
    return next(new HttpError(error));
  }
};
const recentlyAssignedTickets = async (req, res, next) => {
  try {
    const RecentTickets = await Ticket.find({ status: "inprogress" })
      .sort({ updateAt: -1 })
      .limit(4);
    if (!recentlyAssignedTickets.length) {
      return next(new HttpError("No tickets Assigned Recently", 422));
    }
    res.status(200).json(RecentTickets);
  } catch (error) {
    return next(new HttpError(error));
  }
};

const StatusTickets = async (req, res, next) => {
  try {
    const { statusCode } = await req.params;
    if (!statusCode) {
      return next(
        new HttpError("Something Went wrong ,Please check the Status", 422)
      );
    }
    const ticketStatus = await Ticket.find({ status: statusCode }).sort({
      createdAt: -1,
    });
    if (!ticketStatus) {
      return next(new HttpError(`There is No ${statusCode} Tickets `, 422));
    }
    return res.status(200).json(ticketStatus);
  } catch (error) {
    return next(new HttpError(error));
  }
};

const ticketCounts = async (req, res, next) => {
  try {
    const openCount = await Ticket.countDocuments({ status: "open" });
    const closedCount = await Ticket.countDocuments({ status: "closed" });
    const inProgressCount = await Ticket.countDocuments({
      status: "inprogress",
    });

    res.status(200).json({
      open: openCount,
      closed: closedCount,
      inProgress: inProgressCount,
    });
  } catch (error) {
    console.error(error);
    return next(new HttpError(error));
  }
};
const assignedTicketCounts = async (req, res, next) => {
  if (req.user.role === !"maintainence") {
    return next(new HttpError("Only for maintainece Role"));
  }
  try {
    // const openCount = await Ticket.countDocuments({
    //   assignedTo: req.user.id,
    //   status: "open",
    // });
    const closedCount = await Ticket.countDocuments({
      assignedTo: req.user.id,
      status: "closed",
    });
    const inProgressCount = await Ticket.countDocuments({
      assignedTo: req.user.id,
      status: "inprogress",
    });

    res.status(200).json({
      // open: openCount,
      closed: closedCount,
      inProgress: inProgressCount,
    });
  } catch (error) {
    console.error(error);
    return next(new HttpError(error));
  }
};

module.exports = {
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
  assignedTicketCounts,
};
