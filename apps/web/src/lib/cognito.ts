import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
  ISignUpResult,
} from "amazon-cognito-identity-js";
import { config } from "./config";

// Initialize the Cognito User Pool
const userPool = new CognitoUserPool({
  UserPoolId: config.cognito.userPoolId,
  ClientId: config.cognito.clientId,
});

export interface SignUpParams {
  email: string;
  password: string;
  givenName?: string;
  familyName?: string;
}

export interface SignInResult {
  success: boolean;
  user?: CognitoUser;
  session?: CognitoUserSession;
  mfaRequired?: boolean;
  totpSetupRequired?: boolean;
  challengeName?: string;
}

export interface MfaChallengeResult {
  success: boolean;
  session?: CognitoUserSession;
}

/**
 * Sign up a new user with email and password
 */
export function signUp({
  email,
  password,
  givenName,
  familyName,
}: SignUpParams): Promise<ISignUpResult> {
  const attributeList = [
    new CognitoUserAttribute({
      Name: "email",
      Value: email,
    }),
  ];

  if (givenName) {
    attributeList.push(
      new CognitoUserAttribute({
        Name: "given_name",
        Value: givenName,
      }),
    );
  }

  if (familyName) {
    attributeList.push(
      new CognitoUserAttribute({
        Name: "family_name",
        Value: familyName,
      }),
    );
  }

  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, attributeList, [], (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      if (!result) {
        reject(new Error("Sign up failed - no result returned"));
        return;
      }
      resolve(result);
    });
  });
}

/**
 * Confirm sign up with verification code
 */
export function confirmSignUp(email: string, code: string): Promise<void> {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.confirmRegistration(code, true, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Resend confirmation code
 */
export function resendConfirmationCode(email: string): Promise<void> {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.resendConfirmationCode((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

// Store for MFA challenges
let currentCognitoUser: CognitoUser | null = null;

/**
 * Sign in with email and password
 * May return MFA challenge that needs to be completed
 */
export function signIn(email: string, password: string): Promise<SignInResult> {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        currentCognitoUser = null;
        resolve({
          success: true,
          user: cognitoUser,
          session,
        });
      },
      onFailure: (err) => {
        currentCognitoUser = null;
        reject(err);
      },
      mfaRequired: (challengeName) => {
        currentCognitoUser = cognitoUser;
        resolve({
          success: false,
          mfaRequired: true,
          challengeName,
          user: cognitoUser,
        });
      },
      totpRequired: (challengeName) => {
        currentCognitoUser = cognitoUser;
        resolve({
          success: false,
          mfaRequired: true,
          challengeName,
          user: cognitoUser,
        });
      },
      mfaSetup: (challengeName) => {
        currentCognitoUser = cognitoUser;
        resolve({
          success: false,
          totpSetupRequired: true,
          challengeName,
          user: cognitoUser,
        });
      },
      newPasswordRequired: () => {
        // Handle new password requirement if needed
        reject(new Error("New password required - not implemented"));
      },
    });
  });
}

/**
 * Respond to TOTP MFA challenge
 */
export function respondToTotpChallenge(
  code: string,
): Promise<MfaChallengeResult> {
  return new Promise((resolve, reject) => {
    if (!currentCognitoUser) {
      reject(new Error("No active MFA challenge"));
      return;
    }

    currentCognitoUser.sendMFACode(
      code,
      {
        onSuccess: (session) => {
          currentCognitoUser = null;
          resolve({ success: true, session });
        },
        onFailure: (err) => {
          reject(err);
        },
      },
      "SOFTWARE_TOKEN_MFA",
    );
  });
}

/**
 * Get TOTP setup secret for authenticator app
 */
export function setupTOTP(): Promise<string> {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      reject(new Error("No authenticated user"));
      return;
    }

    cognitoUser.getSession((err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }

      cognitoUser.associateSoftwareToken({
        associateSecretCode: (secretCode) => {
          resolve(secretCode);
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  });
}

/**
 * Verify TOTP setup with code from authenticator app
 */
export function verifyTOTP(code: string, deviceName?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      reject(new Error("No authenticated user"));
      return;
    }

    cognitoUser.getSession((err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }

      cognitoUser.verifySoftwareToken(code, deviceName || "AuthenticatorApp", {
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  });
}

/**
 * Set MFA preference (enable/disable TOTP)
 */
export function setMfaPreference(enabled: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      reject(new Error("No authenticated user"));
      return;
    }

    cognitoUser.getSession((err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }

      const totpSettings = {
        PreferredMfa: enabled,
        Enabled: enabled,
      };

      cognitoUser.setUserMfaPreference(null, totpSettings, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
}

/**
 * Initiate forgot password flow
 */
export function forgotPassword(email: string): Promise<void> {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.forgotPassword({
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Confirm new password with reset code
 */
export function confirmPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Sign out current user
 */
export function signOut(): void {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
  currentCognitoUser = null;
}

/**
 * Global sign out (invalidates all sessions)
 */
export function globalSignOut(): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      resolve();
      return;
    }

    cognitoUser.getSession((err: Error | null) => {
      if (err) {
        // Session invalid, just sign out locally
        cognitoUser.signOut();
        resolve();
        return;
      }

      cognitoUser.globalSignOut({
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          // Still sign out locally even if global fails
          cognitoUser.signOut();
          reject(err);
        },
      });
    });
  });
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): CognitoUser | null {
  return userPool.getCurrentUser();
}

/**
 * Get current session (refreshes if needed)
 */
export function getSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession(
      (err: Error | null, session: CognitoUserSession | null) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(session);
      },
    );
  });
}

/**
 * Get user attributes
 */
export function getUserAttributes(): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      reject(new Error("No authenticated user"));
      return;
    }

    cognitoUser.getSession((err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }

      cognitoUser.getUserAttributes((err, attributes) => {
        if (err) {
          reject(err);
          return;
        }

        const attrs: Record<string, string> = {};
        attributes?.forEach((attr) => {
          attrs[attr.getName()] = attr.getValue();
        });
        resolve(attrs);
      });
    });
  });
}

/**
 * Update the currently signed-in user's attributes
 */
export function updateUserAttributes(
  attributes: Record<string, string>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      reject(new Error("No authenticated user"));
      return;
    }

    cognitoUser.getSession((err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }

      const attributeList = Object.entries(attributes).map(
        ([Name, Value]) => new CognitoUserAttribute({ Name, Value }),
      );
      cognitoUser.updateAttributes(attributeList, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
}

/**
 * Change password for the currently signed-in user
 */
export function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      reject(new Error("No authenticated user"));
      return;
    }

    cognitoUser.getSession((err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }

      cognitoUser.changePassword(oldPassword, newPassword, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
}

/**
 * Delete the currently signed-in user's account
 */
export function deleteUser(): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      reject(new Error("No authenticated user"));
      return;
    }

    cognitoUser.getSession((err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }

      cognitoUser.deleteUser((err) => {
        if (err) {
          reject(err);
          return;
        }
        currentCognitoUser = null;
        resolve();
      });
    });
  });
}

/**
 * Get ID token for API calls
 */
export async function getIdToken(): Promise<string | null> {
  const session = await getSession();
  return session?.getIdToken().getJwtToken() ?? null;
}

/**
 * Get access token for API calls
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.getAccessToken().getJwtToken() ?? null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getSession();
    return session?.isValid() ?? false;
  } catch {
    return false;
  }
}
