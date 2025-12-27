
import mongoose from "mongoose";

const privilegeSchema = new mongoose.Schema({
    code: {type:String},
    name: {type: String},
    actions:[{type: String}],

    isActive: {type: Boolean, required: true, default: true},
    isEditable: {type: Boolean, required: true, default: false},
    createdDate: {type: Date, required: true, default: new Date()},
});

const Privilege = mongoose.model('Privilege', privilegeSchema);

export default Privilege;