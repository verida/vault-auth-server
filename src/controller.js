

class Controller {

    /**
     * Load a VID document from a VID
     * @param {*} req 
     * @param {*} res 
     */
    async request(req, res) {
        return res.status(200).send({
            status: "success",
            data: {
                hello: "request"
            }
        });
    }

    /**
     * Load a VID document from a VID
     * @param {*} req 
     * @param {*} res 
     */
    async response(req, res) {
        return res.status(200).send({
            status: "success",
            data: {
                hello: "response"
            }
        });
    }

}

const controller = new Controller();
export default controller;