"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTutor } from "../TutorContext";
import { tutorsApi } from "@/lib/api";
import { usersApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  User,
  BookOpen,
  Calendar,
  AlertCircle,
  Check,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";

interface TimeSlot {
  hourStart: number;
  isAvailable: boolean;
}

interface TutorProfile {
  bio?: string;
  expertise: string[];
  videoPlatformLink?: string;
  teachingLanguages: string[];
  yearsExperience?: number;
  education?: string;
  availableTimeSlots?: number[];
}

interface UnavailableDate {
  id: string;
  unavailableDate: string;
  reason?: string;
}

export default function TutorProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { tutor } = useTutor();

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile fields
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [videoPlatformLink, setVideoPlatformLink] = useState("");
  const [teachingLanguages, setTeachingLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState("");
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [education, setEducation] = useState("");

  // Availability state
  const [availableHours, setAvailableHours] = useState<number[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>(
    []
  );
  const [newUnavailableDate, setNewUnavailableDate] = useState("");
  const [newUnavailableDateReason, setNewUnavailableDateReason] = useState("");
  const [showUnavailableDateForm, setShowUnavailableDateForm] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    availability: true,
    unavailableDates: true,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Redirect if not authenticated or not a tutor
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "tutor")) {
      router.push("/login");
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Load tutor profile and availability data
  useEffect(() => {
    if (isAuthenticated && user?.role === "tutor" && tutor) {
      loadProfileData();
    }
  }, [tutor, isAuthenticated, user]);

  const loadProfileData = async () => {
    try {
      setIsLoadingData(true);
      // Load profile info
      if (tutor) {
        setBio(tutor.bio || "");
        setExpertise(tutor.expertise || []);
        setVideoPlatformLink(tutor.videoPlatformLink || "");
        setTeachingLanguages(tutor.teachingLanguages || []);
        setYearsExperience(tutor.yearsExperience || 0);
        setEducation(tutor.education || "");
        // Get available hours from tutor's timeSlots (availableTimeSlots is from API response)
        if ((tutor as any).availableTimeSlots) {
          setAvailableHours((tutor as any).availableTimeSlots);
        }
      }

      // Fetch unavailable dates from backend
      if (tutor?.id) {
        try {
          const dates = await tutorsApi.getUnavailableDates(tutor.id);
          setUnavailableDates(dates);
        } catch (err) {
          console.error("Failed to fetch unavailable dates:", err);
          // Don't show error if endpoint doesn't exist yet
        }
      }
    } catch (err) {
      console.error("Failed to load profile data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const toggleSection = (
    section: "profile" | "availability" | "unavailableDates"
  ) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleAddExpertise = () => {
    if (expertiseInput.trim() && !expertise.includes(expertiseInput)) {
      setExpertise([...expertise, expertiseInput]);
      setExpertiseInput("");
    }
  };

  const handleRemoveExpertise = (item: string) => {
    setExpertise(expertise.filter((e) => e !== item));
  };

  const handleAddLanguage = () => {
    if (languageInput.trim() && !teachingLanguages.includes(languageInput)) {
      setTeachingLanguages([...teachingLanguages, languageInput]);
      setLanguageInput("");
    }
  };

  const handleRemoveLanguage = (item: string) => {
    setTeachingLanguages(teachingLanguages.filter((l) => l !== item));
  };

  const handleHourToggle = (hour: number) => {
    if (availableHours.includes(hour)) {
      setAvailableHours(availableHours.filter((h) => h !== hour));
    } else {
      setAvailableHours([...availableHours, hour].sort((a, b) => a - b));
    }
  };

  const handleAddUnavailableDate = async () => {
    if (!newUnavailableDate) {
      setError("Please select a date");
      return;
    }

    try {
      setError(null);
      await tutorsApi.addUnavailableDate(
        newUnavailableDate,
        newUnavailableDateReason
      );
      setUnavailableDates([
        ...unavailableDates,
        {
          id: Math.random().toString(),
          unavailableDate: newUnavailableDate,
          reason: newUnavailableDateReason,
        },
      ]);
      setNewUnavailableDate("");
      setNewUnavailableDateReason("");
      setShowUnavailableDateForm(false);
      setSuccess("Unavailable date added successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add unavailable date");
    }
  };

  const handleSaveAvailability = async () => {
    if (!user?.id) return;
    try {
      setIsSaving(true);
      setError(null);

      // Update availability only
      await tutorsApi.setAvailableHours(availableHours);

      setSuccess("Availability updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Save availability error:", err);
      setError(err.response?.data?.error || "Failed to save availability");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.metaId) return;

    try {
      setIsSaving(true);
      setError(null);

      // Update tutor profile only
      await tutorsApi.updateTutor(user.metaId, {
        bio,
        expertise,
        videoPlatformLink,
        teachingLanguages,
        yearsExperience,
        education,
      });

      setSuccess("Profile updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Save profile error:", err);
      setError(err.response?.data?.error || "Failed to save profile");
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-600">
          Manage your profile and availability settings
        </p>
      </div>

      {/* Success Alert */}
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Section */}
      <Card className="mb-6">
        <CardHeader
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("profile")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-purple-600" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            {expandedSections.profile ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </div>
        </CardHeader>

        {expandedSections.profile && (
          <CardContent className="space-y-6">
            {/* Bio */}
            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell students about yourself..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  rows={4}
                />
              ) : (
                <p className="text-gray-600">{bio || "No bio added yet"}</p>
              )}
            </div>

            {/* Expertise */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Expertise
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={expertiseInput}
                      onChange={(e) => setExpertiseInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddExpertise();
                        }
                      }}
                      placeholder="e.g., Mathematics, Physics"
                    />
                    <Button onClick={handleAddExpertise} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {expertise.map((item) => (
                      <Badge key={item} variant="secondary" className="gap-2">
                        {item}
                        <button
                          onClick={() => handleRemoveExpertise(item)}
                          className="hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {expertise.length > 0 ? (
                    expertise.map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-600">No expertise added yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Teaching Languages */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Teaching Languages
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddLanguage();
                        }
                      }}
                      placeholder="e.g., English, Spanish"
                    />
                    <Button onClick={handleAddLanguage} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {teachingLanguages.map((item) => (
                      <Badge key={item} variant="secondary" className="gap-2">
                        {item}
                        <button
                          onClick={() => handleRemoveLanguage(item)}
                          className="hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {teachingLanguages.length > 0 ? (
                    teachingLanguages.map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-600">No languages added yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Video Platform Link */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Video Platform Link
              </label>
              {isEditing ? (
                <Input
                  type="url"
                  value={videoPlatformLink}
                  onChange={(e) => setVideoPlatformLink(e.target.value)}
                  placeholder="https://zoom.us/my/username"
                />
              ) : (
                <a
                  href={videoPlatformLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {videoPlatformLink || "No link added yet"}
                </a>
              )}
            </div>

            {/* Years of Experience */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Years of Experience
              </label>
              {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  value={yearsExperience}
                  onChange={(e) =>
                    setYearsExperience(parseInt(e.target.value) || 0)
                  }
                />
              ) : (
                <p className="text-gray-600">{yearsExperience} years</p>
              )}
            </div>

            {/* Education */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Education
              </label>
              {isEditing ? (
                <Input
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g., BS in Computer Science, MIT"
                />
              ) : (
                <p className="text-gray-600">
                  {education || "No education added yet"}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Availability Section */}
      <Card className="mb-6">
        <CardHeader
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("availability")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Available Hours</CardTitle>
                <CardDescription>
                  Select which hours you're available for sessions
                </CardDescription>
              </div>
            </div>
            {expandedSections.availability ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </div>
        </CardHeader>

        {expandedSections.availability && (
          <CardContent>
            <div className="space-y-4">
              {/* Quick actions */}
              <div className="flex gap-2 mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAvailableHours(hours)}
                >
                  Select All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAvailableHours([])}
                >
                  Clear All
                </Button>
              </div>

              {/* Hour grid */}
              <div className="grid grid-cols-6 gap-2">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    onClick={() => handleHourToggle(hour)}
                    className={`p-2 rounded-lg font-medium text-sm transition ${
                      availableHours.includes(hour)
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </button>
                ))}
              </div>

              {/* Selected hours summary */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">
                  Selected hours: {availableHours.length}/24
                </p>
                <p className="text-xs text-gray-600">
                  {availableHours.length === 0
                    ? "No hours selected"
                    : `${availableHours.join(", ")}`}
                </p>
              </div>

              {/* Save button */}
              <Button
                onClick={handleSaveAvailability}
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? "Saving..." : "Save Availability"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Unavailable Dates Section */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection("unavailableDates")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-red-600" />
              <div>
                <CardTitle>Unavailable Dates</CardTitle>
                <CardDescription>
                  Block dates when you're completely unavailable
                </CardDescription>
              </div>
            </div>
            {expandedSections.unavailableDates ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </div>
        </CardHeader>

        {expandedSections.unavailableDates && (
          <CardContent>
            <div className="space-y-4">
              {/* Add unavailable date form */}
              {!showUnavailableDateForm ? (
                <Button
                  onClick={() => setShowUnavailableDateForm(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Unavailable Date
                </Button>
              ) : (
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={newUnavailableDate}
                      onChange={(e) => setNewUnavailableDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reason (optional)
                    </label>
                    <Input
                      value={newUnavailableDateReason}
                      onChange={(e) =>
                        setNewUnavailableDateReason(e.target.value)
                      }
                      placeholder="e.g., Vacation, Medical appointment"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddUnavailableDate}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      Add Date
                    </Button>
                    <Button
                      onClick={() => {
                        setShowUnavailableDateForm(false);
                        setNewUnavailableDate("");
                        setNewUnavailableDateReason("");
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* List of unavailable dates */}
              {unavailableDates.length > 0 ? (
                <div className="space-y-2">
                  {unavailableDates.map((date) => (
                    <div
                      key={date.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                    >
                      <div>
                        <p className="font-medium">
                          {format(
                            new Date(date.unavailableDate),
                            "MMMM d, yyyy"
                          )}
                        </p>
                        {date.reason && (
                          <p className="text-sm text-gray-600">{date.reason}</p>
                        )}
                      </div>
                      <button
                        className="text-red-600 hover:text-red-700 opacity-50 cursor-not-allowed"
                        title="Delete feature coming soon"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-4">
                  No unavailable dates set
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
