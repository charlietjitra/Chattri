"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Plus, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TutorFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  timeZone: string;
  bio: string;
  expertise: string[];
  videoPlatformLink: string;
  teachingLanguages: string[];
  yearsExperience: number | string;
  education: string;
  availableHours: number[];
}

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

const LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Portuguese",
  "Russian",
];

const EXPERTISE_OPTIONS = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Languages",
  "Programming",
  "Business",
  "Economics",
  "Chemistry",
  "Physics",
];

export default function TutorsManagement() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tutors, setTutors] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [formData, setFormData] = useState<TutorFormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    timeZone: "UTC",
    bio: "",
    expertise: [],
    videoPlatformLink: "",
    teachingLanguages: [],
    yearsExperience: "",
    education: "",
    availableHours: [],
  });

  useEffect(() => {
    loadTutors();
  }, [pagination.page]);

  const loadTutors = async () => {
    try {
      setPageLoading(true);
      const data = (await adminApi.getTutors?.(
        pagination.page,
        pagination.limit
      )) || {
        tutors: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      setTutors(data.tutors || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Failed to load tutors:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "yearsExperience" ? (value ? parseInt(value) : "") : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMultiSelect = (name: string, value: string) => {
    setFormData((prev) => {
      const current = prev[name as keyof TutorFormData] as string[];
      if (current.includes(value)) {
        return {
          ...prev,
          [name]: current.filter((item) => item !== value),
        };
      } else {
        return {
          ...prev,
          [name]: [...current, value],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (
        !formData.email ||
        !formData.password ||
        !formData.firstName ||
        !formData.lastName
      ) {
        throw new Error("Please fill in all required fields");
      }

      if (formData.expertise.length === 0) {
        throw new Error("Please select at least one expertise");
      }

      if (formData.teachingLanguages.length === 0) {
        throw new Error("Please select at least one teaching language");
      }

      if (!formData.videoPlatformLink) {
        throw new Error("Please provide a video platform link");
      }

      if (!formData.bio) {
        throw new Error("Please provide a bio");
      }

      const payload = {
        ...formData,
        yearsExperience: formData.yearsExperience
          ? parseInt(String(formData.yearsExperience))
          : undefined,
      };

      await adminApi.createTutor(payload);

      setSuccess("Tutor account created successfully!");
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        timeZone: "UTC",
        bio: "",
        expertise: [],
        videoPlatformLink: "",
        teachingLanguages: [],
        yearsExperience: "",
        education: "",
        availableHours: [],
      });
      setIsDialogOpen(false);
      loadTutors();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create tutor";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tutor Management</h1>
          <p className="text-gray-600 mt-2">Create and manage tutor accounts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Tutor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Tutor Account</DialogTitle>
              <DialogDescription>
                Fill in the tutor information to create a new account
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter a strong password"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeZone">Time Zone *</Label>
                    <Select
                      value={formData.timeZone}
                      onValueChange={(value) =>
                        handleSelectChange("timeZone", value)
                      }
                    >
                      <SelectTrigger id="timeZone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="yearsExperience">Years of Experience</Label>
                    <Input
                      id="yearsExperience"
                      name="yearsExperience"
                      type="number"
                      value={formData.yearsExperience}
                      onChange={handleInputChange}
                      placeholder="5"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Professional Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bio">Bio *</Label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Write a brief bio about yourself..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="videoPlatformLink">
                      Video Platform Link *
                    </Label>
                    <Input
                      id="videoPlatformLink"
                      name="videoPlatformLink"
                      type="url"
                      value={formData.videoPlatformLink}
                      onChange={handleInputChange}
                      placeholder="https://zoom.us/meeting/..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="education">Education</Label>
                    <Input
                      id="education"
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      placeholder="B.S. in Computer Science"
                    />
                  </div>
                </div>
              </div>

              {/* Expertise */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Expertise *</h3>
                <div className="space-y-2">
                  {EXPERTISE_OPTIONS.map((expertise) => (
                    <label
                      key={expertise}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.expertise.includes(expertise)}
                        onChange={() =>
                          handleMultiSelect("expertise", expertise)
                        }
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span>{expertise}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Teaching Languages */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Teaching Languages *
                </h3>
                <div className="space-y-2">
                  {LANGUAGE_OPTIONS.map((language) => (
                    <label
                      key={language}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.teachingLanguages.includes(language)}
                        onChange={() =>
                          handleMultiSelect("teachingLanguages", language)
                        }
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span>{language}</span>
                    </label>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? "Creating..." : "Create Tutor"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Tutors List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Tutors ({pagination.total})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pageLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : tutors.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expertise
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Languages
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tutors.map((tutor: any) => (
                    <tr key={tutor.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {tutor.user?.firstName} {tutor.user?.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {tutor.user?.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(tutor.expertise || [])
                            .slice(0, 2)
                            .map((exp: string) => (
                              <Badge
                                key={exp}
                                variant="secondary"
                                className="text-xs"
                              >
                                {exp}
                              </Badge>
                            ))}
                          {(tutor.expertise || []).length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(tutor.expertise || []).length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(tutor.teachingLanguages || [])
                            .slice(0, 2)
                            .map((lang: string) => (
                              <Badge
                                key={lang}
                                variant="outline"
                                className="text-xs"
                              >
                                {lang}
                              </Badge>
                            ))}
                          {(tutor.teachingLanguages || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(tutor.teachingLanguages || []).length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No tutors yet. Create one to get started!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
