import supertest from "supertest";
import { getAllSignatures, insertSignature, setAllSignatures, SignatureCollection } from "../signature/model";
import app  from "../server";

describe("Running through a sequence of requests works as expected", () => {
    beforeAll(() => {
        setAllSignatures([])
    });
    let firstSignatureId = 0;

    test("1st GET /signatures responds with an empty array for signatures", async () => {
        const response = await supertest(app).get("/signatures");
        expect(response.body.status).toBe("success");
        expect(response.body.data.signatures).toStrictEqual([]);
    });

    test("1st POST adds a signature to the empty array", async () => {
        const response = await supertest(app).post("/signatures").send({
            name: "Noddy",
            message: "Hi, I'm Noddy!",
        });
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("signature");
        expect(response.body.data.signature.message).toMatch(/hi, I'm/i);
        firstSignatureId = response.body.data.signature.epochId;
    });

    test("1st GET /signatures/:epoch responds with the newly created signature", async () => {    
        const response = await supertest(app).get(`/signatures/${firstSignatureId}`);
        expect(response.body.status).toBe("success");
        expect(response.body.data).toHaveProperty("signature");
        expect(response.body.data.signature.message).toMatch(/hi, I'm/i);
    });

    test("1st PUT /signatures/:epoch successfully updates the newly created signature", async () => {
        const response = await supertest(app).put(`/signatures/${firstSignatureId}`).send({
            message: "Oh, I'm not so sure who I am, actually"
        });
        expect(response.body.data).toHaveProperty("signature");
        expect(response.body.data.signature).toHaveProperty("name");
    })

    test("2nd GET /signatures/:epoch responds with an updated version of the first signature", async () => {
        const response = await supertest(app).get(`/signatures/${firstSignatureId}`);
        expect(response.body.data.signature.message).toMatch(/not so sure/i);
    })

    test("1st DELETE /signatures/:epoch deletes the first signature", async() => {
        const response = await supertest(app).delete(`/signatures/${firstSignatureId}`);
        expect(response.body.status).toBe("success");
    });

    test("3rd GET /signatures/:epoch returns with a 404", async () => {
        const response = await supertest(app).get(`/signatures/${firstSignatureId}`);
        expect(response.status).toBe(404);
        expect(response.body.status).toBe("fail");
    });

    test("2nd GET /signatures responds with an empty array for signatures", async () => {
        const response = await supertest(app).get("/signatures");
        expect(response.body.status).toBe("success");
        expect(response.body.data.signatures).toStrictEqual([]);
    });
})