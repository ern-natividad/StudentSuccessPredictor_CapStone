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

const readImageFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });

const getLocalProfileKey = (email) => `hawkpredict-profile:${email || "guest"}`;

const ProfilePage = () => {
  const { user, updateUserFields } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(user?.name || "");
  const [profilePicture, setProfilePicture] = useState(
    user?.profilePicture || user?.profile_picture || "",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.name || "");
    setProfilePicture(user?.profilePicture || user?.profile_picture || "");
  }, [user?.name, user?.profilePicture, user?.profile_picture]);

  const initials = useMemo(() => generateInitials(fullName || user?.name), [fullName, user?.name]);
  const roleLabel = ROLE_LABELS[user?.role] || "User";

  const persistLocalProfile = (nextProfile) => {
    localStorage.setItem(getLocalProfileKey(user?.email), JSON.stringify(nextProfile));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 1_000_000) {
      toast.error("Image must be 1 MB or smaller.");
      return;
    }

    try {
      const dataUrl = await readImageFile(file);
      setProfilePicture(String(dataUrl));
    } catch (error) {
      toast.error(error.message || "Unable to load the image.");
    } finally {
      event.target.value = "";
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
        persistLocalProfile({
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

      <div className={styles.contentCard}>
        <div className={styles.profileLayout}>
          <div className={styles.profileAvatarSection}>
            <div className={styles.profileAvatarPreview}>
              {profilePicture ? (
                <img src={profilePicture} alt={`${fullName || user?.name} profile`} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <label className={styles.profileUploadButton}>
              <input type="file" accept="image/*" onChange={handleImageChange} hidden />
              Upload Photo
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
            <p className={styles.profilePhotoHint}>JPG or PNG, up to 1 MB.</p>
          </div>

          <div className={styles.profileFormSection}>
            <div className={styles.profileField}>
              <label htmlFor="profile-full-name">Full Name</label>
              <input
                id="profile-full-name"
                type="text"
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
