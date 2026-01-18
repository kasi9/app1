import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import { FEATURES } from "../config/config";

const Home = () => {
  
    const { baseURL } = useAppContext();

    const insertDefaultData = async () => {

    await axios.post(`${baseURL}/privilege/bulkinsert`, FEATURES);
    toast.success('Default data created');
  }
  
    return (
        <div style={{ width:"100%", height:"80vh", textAlign:"center", backgroundColor:"lightgray",}}>
            <div><h1>Home page</h1></div>
            <div><button onClick={ insertDefaultData } className="btn">Create Default Data</button></div>
        </div>
    );
}

export default Home;