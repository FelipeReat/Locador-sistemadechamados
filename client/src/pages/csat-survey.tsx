
import { useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, Frown, Meh, Smile } from "lucide-react";
import { useAuthenticatedQuery, useAuthenticatedMutation } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

interface CSATSurvey {
  id: string;
  ticket: {
    code: string;
    subject: string;
  };
  sentAt: string;
}

const scoreLabels = {
  1: { label: "Muito Insatisfeito", icon: Frown, color: "text-rose-500" },
  2: { label: "Insatisfeito", icon: Frown, color: "text-red-500" },
  3: { label: "Neutro", icon: Meh, color: "text-slate-500" },
  4: { label: "Satisfeito", icon: Smile, color: "text-emerald-500" },
  5: { label: "Muito Satisfeito", icon: Smile, color: "text-emerald-600" },
};

export default function CSATSurveyPage() {
  const { token } = useParams();
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const { data: survey, isLoading, error } = useAuthenticatedQuery<CSATSurvey>(
    ['csat-survey', token],
    `/csat/${token}`
  );

  const submitMutation = useAuthenticatedMutation(
    `/csat/${token}`,
    'POST',
    {
      onSuccess: () => {
        setSubmitted(true);
        toast({
          title: "Obrigado!",
          description: "Sua avaliação foi enviada com sucesso.",
        });
      },
      onError: (error: Error) => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message,
        });
      },
    }
  );

  const handleSubmit = async () => {
    if (!selectedScore) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione uma pontuação.",
      });
      return;
    }

    submitMutation.mutate({
      score: selectedScore,
      comment: comment.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Frown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pesquisa não encontrada</h2>
            <p className="text-gray-600">
              Esta pesquisa pode ter expirado ou já foi respondida.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Obrigado!</h2>
            <p className="text-gray-600">
              Sua avaliação foi enviada com sucesso. Valorizamos seu feedback!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Star className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Como foi nosso atendimento?</CardTitle>
          <CardDescription className="text-base">
            Sua opinião é muito importante para melhorarmos nossos serviços
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Ticket Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">Chamado</Badge>
              <span className="font-medium">{survey.ticket.code}</span>
            </div>
            <p className="text-sm text-gray-600">{survey.ticket.subject}</p>
          </div>

          {/* Rating */}
          <div>
            <h3 className="font-medium mb-4">Como você avalia o atendimento recebido?</h3>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(scoreLabels).map(([score, config]) => {
                const scoreNum = parseInt(score);
                const Icon = config.icon;
                const isSelected = selectedScore === scoreNum;
                
                return (
                  <button
                    key={score}
                    onClick={() => setSelectedScore(scoreNum)}
                    className={`p-4 border rounded-lg text-center transition-all hover:border-blue-300 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${
                      isSelected ? 'text-blue-600' : config.color
                    }`} />
                    <div className="text-xs font-medium">{score}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {config.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block font-medium mb-2">
              Comentários (opcional)
            </label>
            <Textarea
              placeholder="Deixe seus comentários sobre o atendimento..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit}
              disabled={!selectedScore || submitMutation.isPending}
              className="px-8"
            >
              {submitMutation.isPending ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


