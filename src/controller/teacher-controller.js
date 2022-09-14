const Teacher = require('../model/Teacher');
const ClassSchedule = require('../model/ClassSchedule');
const {StatusCodes} = require('http-status-codes');
const {paginateResult} = require('../util');
const CustomError = require('../errors/index');
const mongoose = require('mongoose');

const createTeacher = async(req,res) => {

    const {
        firstName , 
        lastName , 
        middleName , 
        birtDate,
        address , 
        email ,
        phoneNumber
    } = req.body;

    if(!firstName || !lastName || !birtDate || !address || !email || !phoneNumber) {
        throw new CustomError.BadRequestError("Please complete the required fields!");
    }

    const teacher = await Teacher.create(req.body);

    res.status(StatusCodes.CREATED).send({teacher});

};

const getAllTeacher = async(req,res) => {

    const {search} = req.query;

    let queryObject = {};

    if(search) {
        queryObject = {
            $or : [
                {"firstName" : {$regex : search , $options : 'i'}},
                {"lastName" : {$regex : search , $options : 'i'}},
                {"middleName" : {$regex : search , $options : 'i'}},
                {"email" : {$regex : search , $options : 'i'}},
            ]
        }
    }

    const teacher =  Teacher.find(queryObject);
    
    const paginate = await paginateResult({
        p_page : req.query.page , 
        p_limit : req.query.limit , 
        result : teacher, 
        DataModel:  Teacher,
        query : queryObject,
    });
    
    
    res.status(StatusCodes.OK).send({
        teacher : paginate.object , 
        totalStundets : paginate.totalObject , 
        numOfPages : paginate.numOfPages,
        page : req.query.page || 1,
    });

}

const getSingleTeacher = async(req,res) => {

    const {id:teacherId} = req.params;

    const teacher = await Teacher.findOne({_id : teacherId});

    if(!teacher) {
        throw new CustomError.NotFoundError(`No Teacher with id ${teacherId}`);
    }
    
    res.status(StatusCodes.OK).json({teacher});
}

const updateTeacher = async(req,res) => {
    const {id : teacherId} = req.params;

    const teacher = await Teacher.findOneAndUpdate(
        {_id : teacherId} , 
        req.body , 
        {new : true , runValidators : true}
    );
    
    if(!teacher) {
        throw new CustomError.BadRequestError(`No teacher with id ${teacherId}`);
    }
    res.status(StatusCodes.OK).json({teacher});

}

const removeTeacher = async(req,res) => {
    const {id : teacherId} = req.params;

    const teacher = await Teacher.findOne({_id : teacherId});

    if(!teacher) {
        throw new CustomError.BadRequestError(`No teacher with id ${teacherId}`);
    }

    teacher.remove();

    res.status(StatusCodes.OK).json({msg : 'Teacher Deleted from the records'});

}

const getTeacherSchedule = async(req,res) => {
    
    // Tempory until the auth is finish

    req.user = {userId : "6321c0fc652bd28c329faae6"};

    let testQuery = await ClassSchedule.aggregate([
        {$match : {teacher: mongoose.Types.ObjectId(req.user.userId)}},
        {$group : {
            _id:{ subject:"$subject",},
            student : { $addToSet: '$student' },
            count:{$sum:1},
        }},
        {
            $lookup:{
                from: "students",
                localField: "student", //this is the _id user from tests
                foreignField: "_id", //this is the _id from users
                as: "student"
            },  
        },
        { $addFields: {
                student: {
                    '$map': {
                        input: '$student',
                        in: {
                            _id : '$$this._id',
                            firstName: '$$this.firstName',
                            lastName: '$$this.lastName'
                        }
                    }
                }
            }
        }
    ]);


    
    res.status(StatusCodes.OK).json(testQuery);


}

module.exports = {
    createTeacher,
    getAllTeacher,
    getSingleTeacher,
    updateTeacher,
    removeTeacher,
    getTeacherSchedule
}