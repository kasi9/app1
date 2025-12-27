import ReactDOM from "react-dom";
import Role from "./role";

export const ModalWindow = () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const handleAdd = (role: Role) => {
        window.opener?.postMessage({type:'role', role: role}, '*');
    };

    const handleClose = () => { window.close()};

    return ReactDOM.createPortal(<Role onSave={handleAdd} onClose={handleClose}/>, container);
}
