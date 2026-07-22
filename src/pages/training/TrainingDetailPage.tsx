"use client"

import FloatingHeader from "@/components/FloatingHeader";
import { Play, Clock, Users, Award, CheckCircle, Star, Calendar, Globe, Download, Share2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import { ModuleTopic, CertificateDetail } from "@/data/trainings";
import { supabase } from "@/lib/supabaseClient";

export default function TrainingDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [training, setTraining] = useState<any>(null);
  const [instructor, setInstructor] = useState<any>(null);
  const [curriculumModules, setCurriculumModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchTraining = async () => {
      if (!slug) return;
      setIsLoading(true);
      
      // Fetch from training_programs
      const { data, error } = await supabase
        .from("training_programs")
        .select("*")
        .eq("slug", slug)
        .single();
        
      if (data) {
        // Try to fetch certification details if they exist in the trainings table
        const { data: certData } = await supabase
          .from("trainings")
          .select("id")
          .eq("slug", slug)
          .single();
          
        let certs = [];
        if (certData) {
          const { data: details } = await supabase
            .from("certification_details")
            .select("*")
            .eq("training_id", certData.id);
          if (details) certs = details;
        }
        
        // Fetch instructor if exists
        if (data.instructor_id) {
          const { data: instData } = await supabase
            .from("instructors")
            .select("*")
            .eq("id", data.instructor_id)
            .single();
          if (instData) setInstructor(instData);
        }

        // Fetch curriculum modules and topics
        const { data: modulesData } = await supabase
          .from("curriculum_modules")
          .select("*")
          .eq("training_id", data.id)
          .order("module_number", { ascending: true });

        if (modulesData && modulesData.length > 0) {
          const moduleIds = modulesData.map((m: any) => m.id);
          const { data: topicsData } = await supabase
            .from("curriculum_topics")
            .select("*")
            .in("module_id", moduleIds);

          const fullModules = modulesData.map((mod: any) => ({
            ...mod,
            topics: topicsData ? topicsData.filter((t: any) => t.module_id === mod.id).sort((a: any, b: any) => a.week_label.localeCompare(b.week_label)) : [],
          }));
          setCurriculumModules(fullModules);
        }

        setTraining({
          ...data,
          certifications_details: certs,
          what_you_will_learn: data.what_you_will_learn || [],
          program_features: data.program_features || [],
        });
      }
      setIsLoading(false);
    };
    fetchTraining();
  }, [slug]);

  const [selectedModule, setSelectedModule] = useState<{ title: string; duration: string; description: string; topics: ModuleTopic[] } | null>(null)
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateDetail | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Removed static moduleDetails

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
        <p className="text-xl text-gray-500">Loading training details...</p>
      </div>
    );
  }

  if (!training) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <FloatingHeader />
      {/* Header */}
      <div className="bg-white border-b pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Programs
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Brochure
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Section */}
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gray-900 rounded-t-lg overflow-hidden">
                  {isPlaying ? (
                    <video
                      src="/hero-video.mp4" // Pastikan video ini ada di folder public Anda
                      className="w-full h-full object-cover"
                      autoPlay
                      controls
                    />
                  ) : (
                    <>
                      <img
                        src={training.image || "/news1.jpeg"}
                        className="w-full h-full object-cover"
                        alt={training.title}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Button size="lg" className="rounded-full w-20 h-20 bg-white/20 backdrop-blur-sm hover:bg-white/30" onClick={() => setIsPlaying(true)}>
                          <Play className="w-8 h-8 ml-1 text-white" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">{training.title}</h1>
                    {training.featured && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Featured Program
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-gray-600 mb-4">{training.description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {training.duration}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Professional Level
                    </div>
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-1" />
                      {training.certification}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="certification">Certification</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Program Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">
                      Our Emergency Medical Services training program is designed to provide comprehensive education and
                      hands-on experience for aspiring and current emergency medical professionals. This intensive
                      program combines theoretical knowledge with practical skills to prepare students for real-world
                      emergency situations.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">What You'll Learn:</h4>
                        <ul className="space-y-2">
                          {training.what_you_will_learn && training.what_you_will_learn.length > 0 ? (
                            training.what_you_will_learn.map((item: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-600">{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-gray-500 italic">No specific learning objectives listed.</li>
                          )}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Program Features:</h4>
                        <ul className="space-y-2">
                          {training.program_features && training.program_features.length > 0 ? (
                            training.program_features.map((item: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-600">{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-gray-500 italic">No program features listed.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="curriculum" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Curriculum</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {curriculumModules.length > 0 ? (
                        curriculumModules.map((mod, modIndex) => (
                          <div key={mod.id} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">Module {mod.module_number}: {mod.title}</h4>
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-blue-500">{mod.duration}</Badge>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedModule(mod)}>
                                      Detail Module
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>{mod.title}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-6">
                                      <div>
                                        <p className="text-gray-600 mb-4">{mod.description}</p>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                                          <Badge variant="secondary">{mod.duration}</Badge>
                                        </div>
                                      </div>
                                      <div className="space-y-4">
                                        {mod.topics.map((topic: any, index: number) => (
                                          <div key={index} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                              <h4 className="font-semibold text-gray-900">
                                                {topic.week_label}: {topic.title}
                                              </h4>
                                            </div>
                                            <ul className="space-y-1">
                                              {topic.content.map((item: string, itemIndex: number) => (
                                                <li key={itemIndex} className="flex items-start">
                                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                  <span className="text-sm text-gray-600">{item}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                            <ul className="text-sm text-gray-600 space-y-1 ml-4">
                              {mod.topics.map((t: any, i: number) => (
                                <li key={i}>• {t.title}</li>
                              ))}
                            </ul>
                            {modIndex < curriculumModules.length - 1 && <Separator />}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">Curriculum details not available for this program.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requirements" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Prerequisites & Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Educational Requirements:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">High school diploma or equivalent</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">Current EMT-Basic certification (preferred)</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">CPR certification</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Physical Requirements:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">Physical fitness assessment</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">Medical clearance from physician</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">Drug screening and background check</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certification" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Certification & Career Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Certifications Earned:</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {training.certifications_details.map((cert, index) => (
                          <div 
                            key={index}
                            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => setSelectedCertificate(cert)}
                          >
                            <div className="flex items-center mb-2">
                              <Award className="w-5 h-5 text-blue-500 mr-2" />
                              <span className="font-medium">{cert.name}</span>
                            </div>
                            <p className="text-sm text-gray-600">{cert.issuer}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Career Opportunities:</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <ul className="space-y-2">
                          <li>• Emergency Medical Technician</li>
                          <li>• Paramedic</li>
                          <li>• Flight Medic</li>
                          <li>• Emergency Room Technician</li>
                        </ul>
                        <ul className="space-y-2">
                          <li>• Fire Department Medic</li>
                          <li>• Critical Care Transport</li>
                          <li>• EMS Supervisor</li>
                          <li>• Training Instructor</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Card */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src="/placeholder.svg?height=64&width=64" alt="Dr. Sarah Johnson" />
                    <AvatarFallback>SJ</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Dr. Sarah Johnson</h4>
                    <p className="text-sm text-gray-600 mb-2">Paramedic, MD Emergency Medicine</p>
                    <div className="flex items-center mb-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-2">4.9 (127 reviews)</span>
                    </div>
                    <p className="text-xs text-gray-500">15+ years experience in emergency medicine and EMS training</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Program Details */}
            <Card>
              <CardHeader>
                <CardTitle>Program Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="font-medium">6-12 months</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Format</span>
                  <span className="font-medium">Hybrid</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Class Size</span>
                  <span className="font-medium">Max 24 students</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next Start Date</span>
                  <span className="font-medium">March 15, 2024</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Language</span>
                  <span className="font-medium">English</span>
                </div>
              </CardContent>
            </Card>

            {/* Enrollment */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button className="w-full bg-red-600 hover:bg-red-700" size="lg">
                    Enroll Now
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent" size="lg">
                    Schedule Info Session
                  </Button>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Questions? Call us at</p>
                    <p className="font-semibold text-red-600">(555) 123-4567</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Features */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">Online learning platform</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Flexible scheduling</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span className="text-sm">Career placement assistance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-orange-500" />
                  <span className="text-sm">Continuing education credits</span>
                </div>
              </CardContent>
            </Card>

            {/* Instructor Profile */}
            {instructor && (
              <Card>
                <CardHeader>
                  <CardTitle>Lead Instructor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={instructor.image} alt={instructor.name} />
                      <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-lg">{instructor.name}</h4>
                      <p className="text-sm text-gray-500">{instructor.role}</p>
                      <div className="flex items-center mt-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="ml-1 text-sm font-medium">{instructor.rating}</span>
                        <span className="ml-1 text-sm text-gray-500">({instructor.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{instructor.bio}</p>
                  {instructor.certifications && instructor.certifications.length > 0 && (
                    <div className="pt-2 border-t mt-2">
                      <p className="text-sm font-medium mb-2">Certifications:</p>
                      <div className="flex flex-wrap gap-2">
                        {instructor.certifications.map((cert: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">{cert}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Preview Modal */}
      <Dialog open={!!selectedCertificate} onOpenChange={(isOpen) => !isOpen && setSelectedCertificate(null)}>
        <DialogContent className="max-w-3xl p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedCertificate?.name}</DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              Issued by: {selectedCertificate?.issuer}
            </p>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-auto rounded-lg border">
            <img 
              src={selectedCertificate?.previewImage} 
              alt={`Sample of ${selectedCertificate?.name}`}
              className="w-full h-auto"
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button asChild>
              <a href={selectedCertificate?.downloadUrl} download>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
