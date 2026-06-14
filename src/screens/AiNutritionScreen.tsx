import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import {
  PremiumCard,
  PrimaryButton,
  AppInput,
  GradientHeader,
  SectionTitle,
  COLORS,
  PageSlide,
} from '../ui/components';
import { useAppStore } from '../store/useAppStore';

type Sugestao = {
  titulo: string;
  calorias: number;
  alimentos: string;
  horario: string;
  descricao: string;
};

type Mensagem = {
  id: string;
  autor: 'Agente' | 'Usuário';
  texto: string;
  sugestao: Sugestao | null;
};


export const AiScreen = () => {
  const { healthSummary } = useAppStore();

  const [pergunta, setPergunta] = useState('');

  const [carregando, setCarregando] = useState(false);

  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: '1',
      autor: 'Agente',
      texto: `Sou a Fernanda, sua Assistente de Nutrição Virtual. Posso sugerir refeições com base na sua meta diária de ${healthSummary?.calories || 2000} kcal.`,
      sugestao: null,
    },
  ]);


  const enviarPergunta = async () => {
    if (!pergunta.trim()) return;

    const mensagemDoUsuario: Mensagem = {
      id: Date.now().toString(),
      autor: 'Usuário',
      texto: pergunta,
      sugestao: null,
    };

    setMensagens(anterior => [...anterior, mensagemDoUsuario]);
    setPergunta('');
    setCarregando(true);

    try {
      const resposta = await fetch('http://127.0.0.1:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: mensagemDoUsuario.texto,
          profile: {
            caloriesGoal: healthSummary?.calories || 2000,
          },
          healthSummary,
        }),
      });

      const dados = await resposta.json();

      const mensagemDaFernanda: Mensagem = {
        id: (Date.now() + 1).toString(),
        autor: 'Agente',
        texto: dados.reply,
        sugestao: null,
      };

      setMensagens(anterior => [...anterior, mensagemDaFernanda]);
    } catch (erro) {

        console.log("ERRO FRONT:", erro);
     
      const mensagemDeErro: Mensagem = {
        id: (Date.now() + 1).toString(),
        autor: 'Agente',
        texto: 'Não consegui responder agora. Verifique se o servidor está ativo.',
        sugestao: null,
      };

      setMensagens(anterior => [...anterior, mensagemDeErro]);
    } finally {
      setCarregando(false);
    }
  };

  const renderizarMensagem = ({ item }: { item: Mensagem }) => {
    const ehDoUsuario = item.autor === 'Usuário';

    return (
      <View style={[estilos.containerBolha, { alignItems: ehDoUsuario ? 'flex-end' : 'flex-start' }]}>

        <View style={[estilos.bolha, ehDoUsuario ? estilos.bolhaUsuario : estilos.bolhaAgente]}>

          <Text style={[estilos.nomeAutor, { color: ehDoUsuario ? 'rgba(255,255,255,0.86)' : '#4CAF50' }]}>
            {ehDoUsuario ? 'Você' : 'Fernanda'}
          </Text>

          <Text style={{ color: ehDoUsuario ? 'white' : 'black' }}>
            {item.texto}
          </Text>

        </View>

        {item.sugestao && (
          <View style={{ width: '90%', marginTop: 8 }}>
            <PremiumCard>

              <View style={estilos.cabecalhoSugestao}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FontAwesome5 name="lightbulb" size={18} color={COLORS.GreenPrimary} solid />
                  <Text style={estilos.tituloSugestao}>{item.sugestao.titulo}</Text>
                </View>
                <Text style={estilos.caloriasDestaque}>{item.sugestao.calorias} kcal</Text>
              </View>

              <Text style={{ marginBottom: 4 }}>{item.sugestao.alimentos}</Text>

              <Text style={estilos.textoSecundario}>
                Horário sugerido: {item.sugestao.horario}
              </Text>

              <Text style={estilos.textoSecundario}>{item.sugestao.descricao}</Text>

              <PrimaryButton
                text="Adicionar às refeições"
                onClick={() => alert('Refeição salva com sucesso!')}
              />

            </PremiumCard>
          </View>
        )}

      </View>
    );
  };


  return (
    <PageSlide tabIndex={2}>
      <SafeAreaView style={estilos.tela} edges={['top', 'left', 'right']}>

        <FlatList
          data={mensagens}
          keyExtractor={item => item.id}
          contentContainerStyle={estilos.conteudoLista}
          renderItem={renderizarMensagem}

          ListHeaderComponent={
            <>
              <GradientHeader
                title="Fernanda — Assistente de Nutrição Virtual"
                subtitle="Converse sobre lanches, café da manhã, almoço e jantar com recomendações personalizadas."
              />

              <View style={estilos.indicadorAgente}>
                <FontAwesome5 name="robot" size={20} color={COLORS.GreenPrimary} solid />
                <Text style={estilos.textoIndicadorAgente}>Dicas de nutrição personalizadas</Text>
              </View>

              <SectionTitle
                title="Conversa"
                subtitle="Cada recomendação pode virar uma refeição registrada"
              />
            </>
          }
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={estilos.barraDePergunta}>
            <PremiumCard
              style={{
                marginBottom: 0,
                borderRadius: 0,
                borderTopLeftRadius: 26,
                borderTopRightRadius: 26,
              }}
            >
              <SectionTitle
                title="Fale com a Fernanda"
                subtitle="Exemplo: dica de lanche saudável para a tarde"
              />

              <AppInput
                value={pergunta}
                onValueChange={setPergunta}
                label="Faça uma pergunta para a Fernanda"
              />

              <PrimaryButton
                text={carregando ? 'Fernanda está pensando...' : 'Enviar pergunta'}
                onClick={enviarPergunta}
              />

            </PremiumCard>
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </PageSlide>
  );
};


const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  conteudoLista: {
    padding: 16,
    paddingBottom: 24,
  },

  containerBolha: {
    width: '100%',
    marginBottom: 16,
  },

  bolha: {
    maxWidth: '90%',
    padding: 18,
    borderRadius: 24,
  },

  bolhaUsuario: {
    backgroundColor: '#4CAF50',
  },

  bolhaAgente: {
    backgroundColor: 'white',
  },

  nomeAutor: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  cabecalhoSugestao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  tituloSugestao: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  caloriasDestaque: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },

  textoSecundario: {
    color: '#5f6368',
    fontSize: 13,
    marginBottom: 8,
  },

  indicadorAgente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  textoIndicadorAgente: {
    color: COLORS.GreenPrimary,
    fontSize: 14,
    fontWeight: '600',
  },

  barraDePergunta: {
    width: '100%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px -3px 10px rgba(0,0,0,0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
        }),
  },
})
