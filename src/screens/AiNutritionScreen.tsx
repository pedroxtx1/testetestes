import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
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

const ThinkingIndicator = () => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[estilos.containerBolha, { alignItems: 'flex-start', marginBottom: 8 }]}>
      <View style={[estilos.bolha, estilos.bolhaAgente]}>
        <Text style={[estilos.nomeAutor, { color: '#4CAF50' }]}>Fernanda</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <ActivityIndicator size="small" color="#4CAF50" />
          </Animated.View>
          <Text style={{ fontSize: 12, color: '#999' }}>Pensando...</Text>
        </View>
      </View>
    </View>
  );
};

type Sugestao = {
  titulo: string;
  calorias: number;
  alimentos: string;
  horario: string;
  descricao: string;
};

type Mensagem = {
  id: string;
  autor: 'Agente' | 'Usuario';
  texto: string;
  sugestao: Sugestao | null;
};


export const AiScreen = () => {
  const { healthSummary, userProfile } = useAppStore();

  const sessionIdRef = useRef<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSessionId = async () => {
      const storedSessionId = await AsyncStorage.getItem('ai_chat_session_id');
      const nextSessionId = storedSessionId || `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      if (!storedSessionId) {
        await AsyncStorage.setItem('ai_chat_session_id', nextSessionId);
      }

      if (active) {
        sessionIdRef.current = nextSessionId;
        setSessionId(nextSessionId);
      }
    };

    loadSessionId().catch((error) => {
      console.log('ERRO SESSION ID:', error);
      const fallbackSessionId = `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      sessionIdRef.current = fallbackSessionId;
      setSessionId(fallbackSessionId);
    });

    return () => {
      active = false;
    };
  }, []);
const [pergunta, setPergunta] = useState('');

  const [carregando, setCarregando] = useState(false);

  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: '1',
      autor: 'Agente',
      texto: `Sou a Fernanda, sua assistente de nutrição e treino. Posso sugerir refeições e exercícios com base no seu perfil, objetivo e meta diária de ${healthSummary?.calories || 2000} kcal.`,
      sugestao: null,
    },
  ]);

  const [messageAnimations] = useState<{ [key: string]: Animated.Value }>({});
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    mensagens.forEach(msg => {
      if (!messageAnimations[msg.id]) {
        messageAnimations[msg.id] = new Animated.Value(0);
        Animated.timing(messageAnimations[msg.id], {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [mensagens, messageAnimations]);
  
  useEffect(() => {
    if (mensagens.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [mensagens]);


  const enviarPergunta = async () => {
    if (!pergunta.trim() || !sessionId) return;

    const mensagemDoUsuario: Mensagem = {
      id: Date.now().toString(),
      autor: 'Usuario',
      texto: pergunta,
      sugestao: null,
    };

    const historicoAntesDoEnvio = mensagens.slice(-20);

    setMensagens(anterior => [...anterior, mensagemDoUsuario]);
    setPergunta('');
    setCarregando(true);

    try {
      const resposta = await fetch('http://127.0.0.1:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: mensagemDoUsuario.texto,
          userProfile,
          profile: {
            ...userProfile,
            caloriesGoal: healthSummary?.calories || 2000,
          },
          healthSummary,
          clientHistory: historicoAntesDoEnvio.map((msg) => ({
            role: msg.autor === 'Usuario' ? 'user' : 'assistant',
            content: msg.texto,
          })),
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
        texto: 'O Servidor não está respondendo. Por favor, tente novamente mais tarde.',
        sugestao: null,
      };

      setMensagens(anterior => [...anterior, mensagemDeErro]);
    } finally {
      setCarregando(false);
    }
  };

  const renderizarMensagem = ({ item }: { item: Mensagem }) => {
    const ehDoUsuario = item.autor === 'Usuario';
    const animValue = messageAnimations[item.id] || new Animated.Value(1);

    return (
      <Animated.View
        style={[
          estilos.containerBolha,
          {
            alignItems: ehDoUsuario ? 'flex-end' : 'flex-start',
            opacity: animValue,
            transform: [
              {
                translateY: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >

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

      </Animated.View>
    );
  };


  return (
    <PageSlide tabIndex={2}>
      <SafeAreaView style={estilos.tela} edges={['top', 'left', 'right']}>

        <FlatList
          ref={flatListRef}
          data={mensagens}
          keyExtractor={item => item.id}
          contentContainerStyle={[estilos.conteudoLista]}
          renderItem={renderizarMensagem}

          ListFooterComponent={carregando ? <ThinkingIndicator /> : null}

          ListHeaderComponent={
            <>
              <GradientHeader
                title="Fernanda - Nutrição e Treino"
                subtitle="Converse sobre refeições, exercícios, rotina e metas com recomendações personalizadas."
              />

              <View style={estilos.indicadorAgente}>
                <FontAwesome5 name="robot" size={20} color={COLORS.GreenPrimary} solid />
                <Text style={estilos.textoIndicadorAgente}>Dicas de nutrição e treino personalizadas</Text>
              </View>

              <SectionTitle
                title="Conversa"
                subtitle="Cada recomendação pode virar uma refeição registrada"
              />
            </>
          }
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
          <View style={estilos.barraDePergunta}>
            <PremiumCard
              style={{
                marginBottom: 0,
                marginHorizontal: 0,
                borderRadius: 0,
                borderTopLeftRadius: 26,
                borderTopRightRadius: 26,
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <View style={{ gap: 10, width: '100%' }}>
                <Text style={estilos.labelPergunta}>Fale com a Fernanda</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', width: '100%' }}>
                  <TextInput
                  value={pergunta}
                  onChangeText={setPergunta}
                  onSubmitEditing={enviarPergunta}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 18,
                    paddingHorizontal: 16,
                    height: 44,
                    fontSize: 16,
                    backgroundColor: 'white',
                  }}
                  placeholder="Digite sua mensagem..."
                />
                <TouchableOpacity
                  style={estilos.botaoEnviar}
                  onPress={enviarPergunta}
                  disabled={carregando}
                >
                  <MaterialIcons
                    name={carregando ? 'hourglass-empty' : 'send'}
                    size={22}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
              </View>
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

  labelPergunta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },

  botaoEnviar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.GreenPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
})





