import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("../src/lib/jwt", () => ({
  verifyToken: vi.fn().mockReturnValue({ sub: "user-1" }),
}));

import { requireAuth } from "../src/middleware/auth";
import { verifyToken } from "../src/lib/jwt";

function makeReq(authHeader?: string): Partial<Request> {
  return { headers: { authorization: authHeader } };
}

function makeRes(): { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json };
}

describe("requireAuth", () => {
  const next = vi.fn() as unknown as NextFunction;

  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when Authorization header is missing", () => {
    const req = makeReq();
    const res = makeRes();
    requireAuth(req as Request, res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", () => {
    vi.mocked(verifyToken).mockImplementationOnce(() => { throw new Error("bad token"); });
    const req = makeReq("Bearer bad.token.here");
    const res = makeRes();
    requireAuth(req as Request, res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches userId and calls next on valid token", () => {
    const req = makeReq("Bearer valid.token.here") as Request;
    const res = makeRes();
    requireAuth(req, res as unknown as Response, next);
    expect(req.userId).toBe("user-1");
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
