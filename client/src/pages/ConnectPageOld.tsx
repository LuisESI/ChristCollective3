import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationsList } from "@/components/NotificationsList";
import { Bell, Users, MessageSquare, Activity } from "lucide-react";
import { Helmet } from "react-helmet";

const US_CITIES = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA",
  "Austin, TX",
  "Jacksonville, FL",
  "Fort Worth, TX",
  "Columbus, OH",
  "Charlotte, NC",
  "San Francisco, CA",
  "Indianapolis, IN",
  "Seattle, WA",
  "Denver, CO",
  "Washington, DC",
  "Boston, MA",
  "Nashville, TN",
  "Detroit, MI",
  "Portland, OR",
  "Memphis, TN",
  "Oklahoma City, OK",
  "Las Vegas, NV",
  "Louisville, KY",
  "Baltimore, MD",
  "Milwaukee, WI",
  "Atlanta, GA",
  "Miami, FL",
  "Other"
];

const HOBBIES_SPORTS = [
  "Basketball",
  "Football",
  "Soccer",
  "Tennis",
  "Golf",
  "Running",
  "Cycling",
  "Swimming",
  "Hiking",
  "Rock Climbing",
  "Yoga",
  "Martial Arts",
  "Weightlifting",
  "CrossFit",
  "Reading",
  "Writing",
  "Photography",
  "Painting",
  "Music (Playing)",
  "Music (Listening)",
  "Cooking",
  "Gardening",
  "Board Games",
  "Video Games",
  "Chess",
  "Fishing",
  "Hunting",
  "Camping",
  "Travel",
  "Volunteering",
  "Dancing",
  "Theater",
  "Movies",
  "Podcasts",
  "Crafts/DIY",
  "Collecting",
  "Trivia",
  "Bowling",
  "Baseball",
  "Volleyball"
];

const AGE_RANGES = [
  "18-25",
  "26-35",
  "36-45",
  "46-60",
  "60+"
];

interface SurveyData {
  goal: string;
  reasoning: string;
  city: string;
  customCity: string;
  ageRange: string;
  gender: string;
  hobbies: string[];
  commitment: boolean | null;
  paymentWilling: boolean | null;
}

export default function ConnectPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    goal: "",
    reasoning: "",
    city: "",
    customCity: "",
    ageRange: "",
    gender: "",
    hobbies: [],
    commitment: null,
    paymentWilling: null
  });

  const steps = [
    "Welcome",
    "Your Goal",
    "Your Why",
    "Your City",
    "Age & Gender",
    "Hobbies & Sports",
    "Time Commitment",
    "Investment"
  ];

  const getProgressValue = () => ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Skip hobbies step if the goal is "community"
      if (currentStep === 4 && surveyData.goal === "community") {
        setCurrentStep(currentStep + 2); // Skip hobbies step
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      // Skip hobbies step when going back if the goal is "community"
      if (currentStep === 6 && surveyData.goal === "community") {
        setCurrentStep(currentStep - 2); // Skip hobbies step
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleSubmit = () => {
    // TODO: Submit survey data to backend
    console.log("Survey submitted:", surveyData);
    // For now, just show success message
    alert("Application submitted! We'll match you with local Christians in your area.");
    navigate("/dashboard");
  };

  const getGoalText = () => {
    switch (surveyData.goal) {
      case "entrepreneurs":
        return "meet with local Christian entrepreneurs";
      case "friends":
        return "make new local Christian friends";
      case "community":
        return "find a Christian community/church";
      default:
        return "connect with other Christians";
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return surveyData.goal !== "";
      case 2:
        return surveyData.reasoning.trim() !== "";
      case 3:
        return surveyData.city !== "" && (surveyData.city !== "Other" || surveyData.customCity.trim() !== "");
      case 4:
        return surveyData.ageRange !== "" && surveyData.gender !== "";
      case 5:
        // Skip hobbies validation for community goal
        if (surveyData.goal === "community") {
          return true;
        }
        return surveyData.hobbies.length > 0;
      case 6:
        return surveyData.commitment !== null;
      case 7:
        return surveyData.paymentWilling !== null;
      default:
        return false;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md bg-black border-gray-600">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to join our Christian community matching program.</p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Connect with Christians</h1>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          <div className="mt-4">
            <Progress value={getProgressValue()} className="h-2" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="bg-black border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              {currentStep === 0 && <Users className="h-5 w-5 text-primary" />}
              {currentStep === 1 && <Heart className="h-5 w-5 text-primary" />}
              {currentStep === 2 && <Heart className="h-5 w-5 text-primary" />}
              {currentStep === 3 && <MapPin className="h-5 w-5 text-primary" />}
              {currentStep === 4 && <Calendar className="h-5 w-5 text-primary" />}
              {currentStep === 5 && <Gamepad2 className="h-5 w-5 text-primary" />}
              {currentStep === 6 && <Clock className="h-5 w-5 text-primary" />}
              {currentStep === 7 && <DollarSign className="h-5 w-5 text-primary" />}
              {steps[currentStep]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Welcome */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-4">Welcome to Christ Collective Connect</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our mission is to unite Christians worldwide through meaningful local connections. 
                    Whether you're looking to network with fellow Christian entrepreneurs, make new friends 
                    in your faith community, or find a local church, we'll match you with like-minded 
                    believers in your area.
                  </p>
                </div>
                <div className="bg-primary/5 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">How it works:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Complete our quick 5-minute survey
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Get matched with Christians in your city
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Join organized meetups and events
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Build lasting faith-based relationships
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 2: Goal Selection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold mb-2">What's your main goal?</h2>
                  <p className="text-muted-foreground">Choose what you're most interested in connecting with other Christians about.</p>
                </div>
                <RadioGroup
                  value={surveyData.goal}
                  onValueChange={(value) => setSurveyData({ ...surveyData, goal: value })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value="entrepreneurs" id="entrepreneurs" />
                    <Label htmlFor="entrepreneurs" className="flex-1 cursor-pointer">
                      <div className="font-bold text-base">Meet Local Christian Entrepreneurs</div>
                      <div className="text-xs text-muted-foreground font-normal">Network with faith-based business owners and professionals</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value="friends" id="friends" />
                    <Label htmlFor="friends" className="flex-1 cursor-pointer">
                      <div className="font-bold text-base">Make New Local Christian Friends</div>
                      <div className="text-xs text-muted-foreground font-normal">Build meaningful friendships with fellow believers</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value="community" id="community" />
                    <Label htmlFor="community" className="flex-1 cursor-pointer">
                      <div className="font-bold text-base">Find a Christian Community/Church</div>
                      <div className="text-xs text-muted-foreground font-normal">Connect with local churches and faith communities</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Step 3: Reasoning */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold mb-2">Why do you want to {getGoalText()}?</h2>
                  <p className="text-muted-foreground">Help us understand your motivation so we can make better matches. (1-3 sentences)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reasoning">Your reason</Label>
                  <Textarea
                    id="reasoning"
                    placeholder="Share what's driving you to connect with other Christians in your area..."
                    value={surveyData.reasoning}
                    onChange={(e) => setSurveyData({ ...surveyData, reasoning: e.target.value })}
                    className="min-h-[100px]"
                  />
                  <div className="text-sm text-muted-foreground text-right">
                    {surveyData.reasoning.length}/500
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: City Selection */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold mb-2">What is your home city?</h2>
                  <p className="text-muted-foreground">We'll match you with Christians in your local area.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Select your city</Label>
                    <Select value={surveyData.city} onValueChange={(value) => setSurveyData({ ...surveyData, city: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your city" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {surveyData.city === "Other" && (
                    <div className="space-y-2">
                      <Label htmlFor="customCity">Enter your city</Label>
                      <Input
                        id="customCity"
                        placeholder="City, State"
                        value={surveyData.customCity}
                        onChange={(e) => setSurveyData({ ...surveyData, customCity: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Age Range & Gender */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold mb-2">Tell us about yourself</h2>
                  <p className="text-muted-foreground">
                    This helps us connect you with Christians in similar life stages.
                  </p>
                </div>
                
                {/* Age Range Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">What's your age range?</Label>
                  <RadioGroup
                    value={surveyData.ageRange}
                    onValueChange={(value) => setSurveyData({ ...surveyData, ageRange: value })}
                    className="space-y-3"
                  >
                    {AGE_RANGES.map((range) => (
                      <div key={range} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                        <RadioGroupItem value={range} id={range} />
                        <Label htmlFor={range} className="flex-1 cursor-pointer">
                          <div className="font-medium">{range}</div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Gender Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Gender</Label>
                  <RadioGroup
                    value={surveyData.gender}
                    onValueChange={(value) => setSurveyData({ ...surveyData, gender: value })}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="flex-1 cursor-pointer">
                        <div className="font-medium">Male</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="flex-1 cursor-pointer">
                        <div className="font-medium">Female</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 6: Hobbies & Sports */}
            {currentStep === 5 && (surveyData.goal === "entrepreneurs" || surveyData.goal === "friends") && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold mb-2">What are your favorite hobbies & sports?</h2>
                  <p className="text-muted-foreground">
                    Select activities you enjoy. This helps us match you with like-minded Christians who share your interests.
                  </p>
                </div>
                <div className="space-y-4">
                  <Label>Select your interests (choose multiple)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                    {HOBBIES_SPORTS.map((hobby) => (
                      <div key={hobby} className="flex items-center space-x-2">
                        <Checkbox
                          id={hobby}
                          checked={surveyData.hobbies.includes(hobby)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSurveyData({
                                ...surveyData,
                                hobbies: [...surveyData.hobbies, hobby]
                              });
                            } else {
                              setSurveyData({
                                ...surveyData,
                                hobbies: surveyData.hobbies.filter(h => h !== hobby)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={hobby} className="text-sm font-normal cursor-pointer">
                          {hobby}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {surveyData.hobbies.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Selected: {surveyData.hobbies.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 7: Time Commitment */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold mb-2">Time Commitment</h2>
                  <p className="text-muted-foreground">
                    Are you willing to commit at least 2 hours a month to {getGoalText()} in {surveyData.city === "Other" ? surveyData.customCity : surveyData.city}?
                  </p>
                </div>
                <RadioGroup
                  value={surveyData.commitment === null ? "" : surveyData.commitment ? "yes" : "no"}
                  onValueChange={(value) => setSurveyData({ ...surveyData, commitment: value === "yes" })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value="yes" id="commit-yes" />
                    <Label htmlFor="commit-yes" className="flex-1 cursor-pointer">
                      <div className="font-medium">Yes, I can commit 2+ hours per month</div>
                      <div className="text-sm text-muted-foreground">I'm ready to actively participate in meetups and events</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value="no" id="commit-no" />
                    <Label htmlFor="commit-no" className="flex-1 cursor-pointer">
                      <div className="font-medium">No, I can't commit that much time right now</div>
                      <div className="text-sm text-muted-foreground">I'd prefer occasional or flexible participation</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Step 8: Payment Willingness */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold mb-2">Program Investment</h2>
                  <p className="text-muted-foreground">
                    If accepted, are you willing to pay a $15/month fee to cover our admin costs for organizing events and maintaining the community?
                  </p>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold mb-2">What your $15/month covers:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Event coordination and venue arrangements</li>
                    <li>• Community management and moderation</li>
                    <li>• Matching algorithm and platform maintenance</li>
                    <li>• Monthly meetup organization</li>
                    <li>• Prayer and support group facilitation</li>
                  </ul>
                </div>
                <RadioGroup
                  value={surveyData.paymentWilling === null ? "" : surveyData.paymentWilling ? "yes" : "no"}
                  onValueChange={(value) => setSurveyData({ ...surveyData, paymentWilling: value === "yes" })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value="yes" id="pay-yes" />
                    <Label htmlFor="pay-yes" className="flex-1 cursor-pointer">
                      <div className="font-medium">Yes, I'm willing to invest $15/month</div>
                      <div className="text-sm text-muted-foreground">I understand this helps support the community</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value="no" id="pay-no" />
                    <Label htmlFor="pay-no" className="flex-1 cursor-pointer">
                      <div className="font-medium">No, I can't afford $15/month right now.</div>
                      <div className="text-sm text-muted-foreground">I'd prefer a free or lower-cost option</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed()}
                  className="flex items-center gap-2"
                >
                  Submit Application
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}