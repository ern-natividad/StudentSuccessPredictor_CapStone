import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../components/Common/Toast";
import { api, isBackendAuthEnabled } from "../../../services/api";
import { generateInitials } from "../../../utils/authUtils";
import styles from "../../../styles/Dashboard.module.css";

const ROLE_LABELS = {
  admin: "System Administrator",
  staff: "Academic Staff",
  student: "Student",
};
const MAX_PROFILE_IMAGE_BYTES = 10 * 1024 * 1024;
const PROFILE_DATABASE = "hawkpredict-profile";
const PROFILE_STORE = "profiles";

const readImageFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });

const getLocalProfileKey = (email) => email || "guest";

const openLocalProfileDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(PROFILE_DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(PROFILE_STORE, { keyPath: "email" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Unable to access local profile storage."));
  });

const readLocalProfile = async (email) => {
  const database = await openLocalProfileDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PROFILE_STORE, "readonly");
    const request = transaction.objectStore(PROFILE_STORE).get(getLocalProfileKey(email));
    request.onsuccess = () => {
      database.close();
      resolve(request.result || null);
    };
    request.onerror = () => {
      database.close();
      reject(new Error("Unable to load the saved local profile."));
    };
  });
};

const persistLocalProfile = async (email, nextProfile) => {
  const database = await openLocalProfileDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PROFILE_STORE, "readwrite");
    transaction.objectStore(PROFILE_STORE).put({
      email: getLocalProfileKey(email),
      ...nextProfile,
    });
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(new Error("Unable to save the local profile."));
    };
    transaction.onabort = () => {
      database.close();
      reject(new Error("Unable to save the local profile."));
    };
  });
};

const ProfilePage = () => {
  const { user, updateUserFields } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(user?.name || "");
  const [profilePicture, setProfilePicture] = useState(
    user?.profilePicture || user?.profile_picture || "",
  );
  const [saving, setSaving] = useState(false);

  const initials = useMemo(() => generateInitials(fullName || user?.name), [fullName, user?.name]);
  const roleLabel = ROLE_LABELS[user?.role] || "User";

  useEffect(() => {
    if (isBackendAuthEnabled() && user?.isAuthenticated) return undefined;

    let active = true;
    readLocalProfile(user?.email)
      .then((profile) => {
        if (!active || !profile) return;
        setFullName((current) => current || profile.fullName || "");
        setProfilePicture((current) => current || profile.profilePicture || "");
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [user?.email, user?.isAuthenticated]);

  const handleImageChange = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    input.value = "";

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      toast.error("Image must be 10 MB or smaller.");
      return;
    }

    try {
      const dataUrl = await readImageFile(file);
      setProfilePicture(String(dataUrl));
    } catch (error) {
      toast.error(error.message || "Unable to load the image.");
    }
  };

  const handleRemovePicture = () => {
    setProfilePicture("");
  };

  const handleSave = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      toast.error("Full name is required.");
      return;
    }

    setSaving(true);
    try {
      if (isBackendAuthEnabled() && user?.isAuthenticated) {
        const profile = await api.updateProfile({
          fullName: trimmedName,
          profilePicture: profilePicture || null,
        });

        updateUserFields({
          name: profile.fullName,
          full_name: profile.fullName,
          fullName: profile.fullName,
          profilePicture: profile.profilePicture || null,
          profile_picture: profile.profilePicture || null,
        });
      } else {
        await persistLocalProfile(user?.email, {
          fullName: trimmedName,
          profilePicture: profilePicture || null,
        });
        updateUserFields({
          name: trimmedName,
          profilePicture: profilePicture || null,
        });
      }

      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageHeaderCard}>
        <div>
          <h1 className={styles.pageTitle}>My Profile</h1>
          <p className={styles.pageSubtitle}>
            Update your display name and profile photo used across HawksPredict.
          </p>
        </div>
      </div>

      <div className={`${styles.contentCard} ${styles.profileCard}`}>
        <div className={styles.profileLayout}>
          <div className={styles.profileAvatarSection}>
            <div className={styles.profileAvatarPreview}>
              {profilePicture ? (
                <img src={profilePicture} alt={`${fullName || user?.name} profile`} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <label className={styles.profileUploadButton} htmlFor="profile-photo">
              <input
                id="profile-photo"
                className={styles.profileFileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                aria-label="Choose a profile photo"
              />
              {profilePicture ? "Change photo" : "Choose photo"}
            </label>
            {profilePicture ? (
              <button
                type="button"
                className={styles.profileRemovePhotoButton}
                onClick={handleRemovePicture}
              >
                Remove Photo
              </button>
            ) : null}
            <p className={styles.profilePhotoHint}>
              JPG, PNG, or WebP. Up to 10 MB.
            </p>
          </div>

          <div className={styles.profileFormSection}>
            <div className={styles.profileFormHeader}>
              <h2 className={styles.profileSectionTitle}>Personal details</h2>
              <p className={styles.profileSectionDescription}>
                Manage the information shown on your account.
              </p>
            </div>
            <div className={styles.profileField}>
              <label htmlFor="profile-full-name">Full Name</label>
              <input
                id="profile-full-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className={styles.profileField}>
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                value={user?.email || ""}
                disabled
              />
            </div>

            <div className={styles.profileField}>
              <label htmlFor="profile-role">Role</label>
              <input id="profile-role" type="text" value={roleLabel} disabled />
            </div>

            <div className={styles.profileActions}>
              <button
                type="button"
                className={styles.profileSaveButton}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
