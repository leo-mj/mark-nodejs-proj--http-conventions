import supertest from "supertest";
import app from "./server";
import {
  DatelessSignature,
  findSignatureByEpoch,
  getAllSignatures,
  insertSignature,
  removeSignatureByEpoch,
  Signature,
  updateSignatureByEpoch,
} from "./signature/model";
import { resetMockFor } from "./test-utils";

// mock all the model functions
jest.mock("./signature/model");

describe("GET /signatures", () => {
  const mockSignaturesResponse: Signature[] = [
    { epochId: Date.now(), name: "Lucy Liu" },
    { epochId: Date.now() + 1, name: "Jackie Chan" },
  ];

  beforeEach(() => {
    resetMockFor(getAllSignatures, () => [...mockSignaturesResponse]);
  });

  it("calls getAllSignatures", async () => {
    await supertest(app).get("/signatures");
    expect(getAllSignatures).toHaveBeenCalledTimes(1);
  });

  it("responds with a status of 200, a status of success and signatures array in data", async () => {
    const response = await supertest(app).get("/signatures");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data).toHaveProperty("signatures");
    expect(response.body.data.signatures).toStrictEqual(mockSignaturesResponse);
  });
});

describe("DELETE /signatures/:epoch", () => {
  const passingEpochId = 1614096121305;
  const passingSignature = {
    epochId: passingEpochId,
    name: "Harrison Ford",
  };

  beforeEach(() => {
    resetMockFor(removeSignatureByEpoch, (epochId: number): Signature | null => {
      return epochId === passingSignature.epochId ? passingSignature : null;
    });
  });

  it("calls removeSignatureByEpoch with the given epoch", async () => {
    await supertest(app).delete("/signatures/1614095562950");
    expect(removeSignatureByEpoch).toHaveBeenCalledWith(1614095562950);
  });

  test("when removeSignatureByEpoch deletes a signature, it returns a 200", async () => {
    const response = await supertest(app).delete(`/signatures/${passingSignature.epochId}`);
    expect(removeSignatureByEpoch).toReturnWith(passingSignature);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
  });

  test("when removeSignatureByEpoch cannot find a signature, it returns a 404", async () => {
    const response = await supertest(app).delete("/signatures/23");
    expect(removeSignatureByEpoch).toReturnWith(null);
    expect(response.status).toBe(404);
    expect(response.body.status).toBe("fail");
    expect(response.body.data).toHaveProperty("epochId");
    expect(response.body.data.epochId).toMatch(/could not find/i);
  });
})

describe("GET /signatures/:epoch", () => {
  const passingEpochId = 1614096121305;
  const passingSignature = {
    epochId: passingEpochId,
    name: "Indiana Jones",
  };

  beforeEach(() => {
    resetMockFor(findSignatureByEpoch, (epochId: number): Signature | null => {
      // mock implementation:
      // return a signature for a specific epochId, otherwise null
      return epochId === passingSignature.epochId ? passingSignature : null;
    });
  });

  it("calls findSignatureByEpoch with the given epoch", async () => {
    await supertest(app).get("/signatures/1614095562950");
    expect(findSignatureByEpoch).toHaveBeenCalledWith(1614095562950);
  });

  test("when findSignatureByEpoch returns a signature, it returns a 200 with the given epoch", async () => {
    const response = await supertest(app).get(
      `/signatures/${passingSignature.epochId}`
    );
    expect(findSignatureByEpoch).toReturnWith(passingSignature);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data).toHaveProperty("signature");
  });

  test("when findSignatureByEpoch returns null, it returns a 404 with information about not managing to find a signature", async () => {
    // add one to get a non-passing epochId value
    const response = await supertest(app).get(
      `/signatures/${passingSignature.epochId + 1}`
    );
    expect(findSignatureByEpoch).toReturnWith(null);
    expect(response.status).toBe(404);
    expect(response.body.status).toBe("fail");
    expect(response.body.data).toHaveProperty("epochId");
    expect(response.body.data.epochId).toMatch(/could not find/i);
  });
});

describe("PUT /signatures/:epoch", () => {
  const passingEpochId = 1614096121305;
  const passingSignature = {
    epochId: passingEpochId,
    name: "Indiana Jones",
  };
  const updateProperties = {
    message:
      "If you want to be a good archeologist, you gotta get out of the library!",
  };

  beforeEach(() => {
    resetMockFor(
      updateSignatureByEpoch,
      (
        epochId: number,
        updateProperties: Partial<Signature>
      ): Signature | null => {
        // mock implementation:
        // simulate updating a signature for a specific epochId
        // otherwise return null
        return epochId === passingSignature.epochId
          ? { ...passingSignature, ...updateProperties }
          : null;
      }
    );
  });

  it("calls updateSignatureByEpoch with the given epoch and property update", async () => {
    await supertest(app)
      .put("/signatures/1614095562950")
      .send(updateProperties);
    expect(updateSignatureByEpoch).toHaveBeenCalledWith(1614095562950, updateProperties);
  });

  test("when updateSignatureByEpoch returns a signature, it returns a 200 with the given epoch and full updated signature", async () => {
    const response = await supertest(app)
      .put(`/signatures/${passingSignature.epochId}`)
      .send(updateProperties);
    expect(updateSignatureByEpoch).toReturnWith({
      ...passingSignature,
      ...updateProperties,
    });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data).toHaveProperty("signature");
  });

  test("when updateSignatureByEpoch returns null, it returns a 404 with information about not managing to update a signature", async () => {
    // add one to patch a non-passing epochId value
    const response = await supertest(app)
      .put(`/signatures/${passingSignature.epochId + 1}`)
      .send(updateProperties);
    expect(updateSignatureByEpoch).toReturnWith(null);
    expect(response.status).toBe(404);
    expect(response.body.status).toBe("fail");
    expect(response.body.data).toHaveProperty("epochId");
    expect(response.body.data.epochId).toMatch(/could not find/i);
  });
});

describe("POST /signatures", () => {
  const mockResponseEpochId = 123456789

  beforeEach(() => {
    resetMockFor(
      insertSignature,
      // mock implementation:
      // just return the signature with a new epochId property
      (signature: DatelessSignature): Signature => ({
        ...signature,
        epochId: mockResponseEpochId,
      })
    );
  });

  it("calls insertSignature with the string name and message passed in the body", async () => {
    await supertest(app).post("/signatures").send({
      name: "Noddy",
      message: "Hi, I'm Noddy!",
    });
    expect(insertSignature).toHaveBeenCalledWith({
      name: "Noddy",
      message: "Hi, I'm Noddy!",
    });
  });

  test("when given appropriate signature data, it responds with a status of 201, a status of success and signature in data", async () => {
    const response = await supertest(app).post("/signatures").send({
      name: "Noddy",
    });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe("success");
    expect(response.body.data).toHaveProperty("signature");
    expect(response.body.data.signature).toStrictEqual({
      name: 'Noddy',
      epochId: mockResponseEpochId
    })
  });

  test("when not provided with a name in the request body, it responds with a status of 400, a status of success and signature in data", async () => {
    const response = await supertest(app).post("/signatures").send({
      naem: "Noddy", // deliberate typo to test response
    });
    expect(response.status).toBe(400);
    expect(response.body.status).toBe("fail");
    expect(response.body.data.name).toMatch(/string value/);
    expect(response.body.data.name).toMatch(/required/);
  });
});
