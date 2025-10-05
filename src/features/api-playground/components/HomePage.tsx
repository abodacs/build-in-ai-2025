import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import {
  Zap,
  Globe,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  Circle,
  Copy,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Removed collapsible import

const apiDetails = {
  summarizer: {
    name: 'Summarizer API',
    icon: Zap,
    description: 'Content summarization and condensation',
    status: 'Coming Soon',
  },
  translator: {
    name: 'Translator API',
    icon: Globe,
    description: 'Real-time language translation',
    status: 'Coming Soon',
  },
  writer: {
    name: 'Writer API',
    icon: ChevronRight,
    description: 'Content generation and creative writing',
    status: 'Coming Soon',
  },
  rewriter: {
    name: 'Rewriter API',
    icon: RotateCcw,
    description: 'Content restructuring and style adaptation',
    status: 'Coming Soon',
  },
  proofreader: {
    name: 'Proofreader API',
    icon: CheckCircle,
    description: 'Grammar and writing improvement',
    status: 'Coming Soon',
  },
  prompt: {
    name: 'Prompt API (Multimodal)',
    icon: Circle,
    description: 'Flexible AI prompting with multimodal support',
    status: 'Coming Soon',
  },
  'language-detection': {
    name: 'Language Detection',
    icon: Globe,
    description: 'Automatic language identification',
    status: 'Coming Soon',
  },
};

export function HomePage() {
  const { activeApi } = useAppStore();
  const [activeTab, setActiveTab] = useState('demo');
  const [inputText, setInputText] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  const currentApi =
    apiDetails[activeApi as keyof typeof apiDetails] || apiDetails.summarizer;
  const Icon = currentApi.icon;

  const generateCode = () => {
    return `// JavaScript example
async function summarizerExample() {
  try {
    // Check if Summarizer API is available
    if (!('Summarizer' in self)) {
      throw new Error('Summarizer API not available');
    }

    // Check availability
    const availability = await Summarizer.availability();
    if (availability === 'no') {
      throw new Error('Summarizer API not available');
    }

    // Configuration
    const options = {
      type: 'key-points',
      format: 'markdown',
      length: 'medium'
    };

    // Initialize the Summarizer API
    const summarizer = await Summarizer.create(options);

    // Process the input
    const result = await summarizer.summarize('Your input text here');

    // Clean up
    summarizer.destroy();

    return result;
  } catch (error) {
    console.error('Summarizer API error:', error);
    throw error;
  }
}

// Usage
summarizerExample()
  .then(result => console.log('Result:', result))
  .catch(error => console.error('Error:', error));`;
  };

  return (
    <div className="p-6">
      {/* API Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-gray-700" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {currentApi.name}
            </h1>
            <p className="text-sm text-gray-500">{currentApi.description}</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          {currentApi.status}
        </Badge>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-gray-200 mb-6">
          <TabsList className="h-auto p-0 bg-transparent justify-start">
            <TabsTrigger
              value="demo"
              className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 bg-transparent text-gray-600 hover:text-gray-900"
            >
              <Zap className="w-4 h-4" />
              Demo
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 bg-transparent text-gray-600 hover:text-gray-900"
            >
              Code
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 bg-transparent text-gray-600 hover:text-gray-900"
            >
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Demo Tab */}
        <TabsContent value="demo" className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-200 p-4">
            <p className="text-sm text-blue-800">
              <strong>Step 1:</strong> Configure the API settings below, then
              try it with your input. Check the <strong>Code</strong> tab to see
              the implementation with your exact configuration.
            </p>
          </div>

          {/* API Configuration */}
          <div>
            <button
              type="button"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="flex items-center gap-2 w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="font-medium">API Configuration</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isConfigOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isConfigOpen && (
              <div className="mt-4">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-medium mb-4">
                    Settings for Summarizer API
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Configure the API options. Changes will be reflected in the
                    generated code.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="summary-type"
                        className="text-sm font-medium"
                      >
                        Summary Type
                      </Label>
                      <Select defaultValue="key-points">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="key-points">Key Points</SelectItem>
                          <SelectItem value="summary">Summary</SelectItem>
                          <SelectItem value="abstract">Abstract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="format" className="text-sm font-medium">
                        Format
                      </Label>
                      <Select defaultValue="markdown">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="markdown">Markdown</SelectItem>
                          <SelectItem value="plain-text">Plain Text</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="length" className="text-sm font-medium">
                        Length
                      </Label>
                      <Select defaultValue="medium">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="long">Long</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="shared-context"
                        className="text-sm font-medium"
                      >
                        Shared Context (Optional)
                      </Label>
                      <Input
                        id="shared-context"
                        placeholder="e.g., This is a technical article about web development"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="input-text" className="text-sm font-medium">
                Input Text
              </Label>
              <span className="text-xs text-gray-500">
                {inputText.length} chars
              </span>
            </div>
            <Textarea
              id="input-text"
              placeholder="Enter text to process with Summarizer API..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[120px] resize-y"
            />
          </div>

          {/* Run Button */}
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
            <Zap className="w-4 h-4 mr-2" />
            Run Summarizer API
          </Button>
        </TabsContent>

        {/* Code Tab */}
        <TabsContent value="code" className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-200 p-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Configure the API and run the demo first to
              see how the code works with your specific configuration and input.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Generated Code</h3>
              <div className="flex items-center gap-2">
                <Select defaultValue="javascript">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
              </div>
            </div>

            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm leading-relaxed">
                <code>{generateCode()}</code>
              </pre>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Security Considerations
            </h3>
            <p className="text-gray-500 mb-6">
              Security best practices for Summarizer API will be documented
              here.
            </p>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="font-medium">Data Privacy</h4>
              </div>
              <p className="text-gray-600">
                All processing happens on-device. Your data never leaves your
                browser.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
