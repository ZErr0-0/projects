import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Trash2, Upload, Download, Eye, Edit, X, Moon, Sun, 
  Lock, Link as LinkIcon, Settings, Check, User, LogIn, LogOut,
  ChevronRight, Clipboard, Home, BarChart2, Key
} from "lucide-react";
import * as XLSX from "xlsx";
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, Link } from 'react-router-dom';

// Константы типов вопросов
const questionTypes = {
  singleChoice: {
    label: "Один вариант",
    icon: "🔘",
    color: "bg-blue-100 text-blue-800",
    darkColor: "bg-blue-900 text-blue-100"
  },
  multipleChoice: {
    label: "Несколько вариантов",
    icon: "☑️",
    color: "bg-purple-100 text-purple-800",
    darkColor: "bg-purple-900 text-purple-100"
  },
  textInput: {
    label: "Текстовое поле",
    icon: "📝",
    color: "bg-green-100 text-green-800",
    darkColor: "bg-green-900 text-green-100"
  },
};

// Компонент статистики теста
const TestStatistics = ({ testId, darkMode, onClose }) => {
  const [testData, setTestData] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    const loadData = () => {
      try {
        const savedTests = JSON.parse(localStorage.getItem('tests') || '{}');
        const savedResponses = JSON.parse(localStorage.getItem('userResponses') || '{}');
        
        if (savedTests[testId]) {
          setTestData(savedTests[testId]);
        }
        
        if (savedResponses[testId]) {
          setResponses(savedResponses[testId]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [testId]);

  const calculateStatistics = () => {
    if (!testData || !responses.length) return null;

    return testData.blocks.map(block => {
      const stats = {
        question: block.question,
        type: block.type,
        totalAnswers: responses.length,
        correctAnswers: 0,
        answerDistribution: {}
      };

      // Для текстовых вопросов
      if (block.type === 'textInput') {
        const correctAnswer = testData.correctAnswers[block.id];
        stats.correctAnswers = responses.filter(response => 
          response.answers[block.id] === correctAnswer
        ).length;
      } 
      // Для вопросов с выбором
      else {
        const correctAnswers = testData.correctAnswers[block.id] || [];
        
        responses.forEach(response => {
          const userAnswer = response.answers[block.id];
          
          if (block.type === 'singleChoice') {
            if (userAnswer === correctAnswers) {
              stats.correctAnswers++;
            }
            stats.answerDistribution[userAnswer] = (stats.answerDistribution[userAnswer] || 0) + 1;
          } 
          else if (block.type === 'multipleChoice') {
            const isCorrect = Array.isArray(userAnswer) && 
              userAnswer.length === correctAnswers.length &&
              userAnswer.every(opt => correctAnswers.includes(opt));
            
            if (isCorrect) stats.correctAnswers++;
            
            userAnswer?.forEach(opt => {
              stats.answerDistribution[opt] = (stats.answerDistribution[opt] || 0) + 1;
            });
          }
        });
      }

      return stats;
    });
  };

  const stats = calculateStatistics();

  if (loading) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${darkMode ? 'dark' : ''}`}>
        <div className={`rounded-xl p-6 w-full max-w-2xl mx-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${darkMode ? 'dark' : ''}`}>
      <div className={`rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Статистика теста: {testData?.title || "Без названия"}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <p>Всего ответов: <span className="font-bold">{responses.length}</span></p>
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <Key size={18} />
            <span>{showAnswers ? "Скрыть ответы" : "Показать ответы"}</span>
          </button>
        </div>

        {stats?.map((questionStats, index) => (
          <div key={index} className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h3 className="font-bold mb-2">{questionStats.question}</h3>
            <p className="mb-2">
              Правильных ответов: {questionStats.correctAnswers} ({Math.round((questionStats.correctAnswers / questionStats.totalAnswers) * 100)}%)
            </p>
            
            {showAnswers && (
              <div className="mt-2">
                <p className="font-semibold mb-1">Правильные ответы:</p>
                {questionStats.type === 'textInput' ? (
                  <p>{testData.correctAnswers[testData.blocks[index].id]}</p>
                ) : questionStats.type === 'singleChoice' ? (
                  <p>{testData.correctAnswers[testData.blocks[index].id]}</p>
                ) : (
                  <p>{testData.correctAnswers[testData.blocks[index].id]?.join(', ')}</p>
                )}
              </div>
            )}

            {Object.keys(questionStats.answerDistribution).length > 0 && (
              <div className="mt-3">
                <p className="font-semibold mb-1">Распределение ответов:</p>
                {Object.entries(questionStats.answerDistribution).map(([option, count]) => (
                  <div key={option} className="mb-1">
                    <div className="flex justify-between mb-1">
                      <span>{option}</span>
                      <span>{count} ({Math.round((count / questionStats.totalAnswers) * 100)}%)</span>
                    </div>
                    <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}>
                      <div 
                        className="h-full rounded-full bg-blue-500" 
                        style={{ width: `${(count / questionStats.totalAnswers) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {responses.length === 0 && (
          <p className="text-center py-4">Пока нет данных о прохождениях этого теста</p>
        )}
      </div>
    </div>
  );
};

// Компонент личного кабинета
const UserDashboard = ({ darkMode }) => {
  const [userTests, setUserTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserTests = () => {
      try {
        const savedTests = JSON.parse(localStorage.getItem('tests') || '{}');
        const user = localStorage.getItem('currentUser');
        
        if (user) {
          const tests = Object.entries(savedTests)
            .filter(([_, test]) => test.creator === user)
            .map(([id, test]) => ({ id, ...test }));
          
          setUserTests(tests);
        }
        setLoading(false);
      } catch (error) {
        console.error('Ошибка загрузки тестов:', error);
        setLoading(false);
      }
    };

    loadUserTests();
  }, []);

  const copyToClipboard = (link) => {
    navigator.clipboard.writeText(link);
    alert('Ссылка скопирована в буфер обмена');
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        Загрузка...
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'} p-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Личный кабинет</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/builder')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              <Plus size={18} />
              <span>Создать новый тест</span>
            </button>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <LogOut size={18} />
              <span>Выйти</span>
            </button>
          </div>
        </div>

        {userTests.length === 0 ? (
          <div className={`p-8 rounded-xl text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
            <p className="text-xl mb-4">У вас пока нет созданных тестов</p>
            <button
              onClick={() => navigate('/builder')}
              className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              Создать первый тест
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userTests.map((test) => (
              <div key={test.id} className={`rounded-xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{test.title || "Без названия"}</h3>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {test.description || "Нет описания"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(test.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      {test.blocks?.length || 0} вопросов
                    </span>
                  </div>
                </div>
                <div className={`px-6 py-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex flex-wrap gap-2 justify-between`}>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/test/${test.id}`)}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
                  >
                    <Clipboard size={16} />
                    <span>Копировать ссылку</span>
                  </button>
                  <button
                    onClick={() => navigate(`/test/${test.id}`)}
                    className="flex items-center gap-1 text-green-500 hover:text-green-700"
                  >
                    <span>Пройти тест</span>
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => setShowStats(test.id)}
                    className="flex items-center gap-1 text-purple-500 hover:text-purple-700 mt-2 w-full justify-center"
                  >
                    <BarChart2 size={16} />
                    <span>Статистика</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showStats && (
          <TestStatistics 
            testId={showStats} 
            darkMode={darkMode} 
            onClose={() => setShowStats(null)} 
          />
        )}
      </div>
    </div>
  );
};

// Компонент главной страницы
const LandingPage = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [authModal, setAuthModal] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const containerRef = useRef(null);
  
  const slides = [
    {
      title: "Создавайте впечатляющие тесты",
      subtitle: "Интерактивные формы с анимациями и красивым дизайном",
      bgColor: "from-blue-500 to-purple-600",
      content: (
        <div className="space-y-6">
          <div className={`p-8 rounded-2xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-2xl transform transition-all hover:scale-105`}>
            <h3 className="text-xl font-bold mb-2">Простое создание</h3>
            <p>Интуитивный интерфейс для быстрого создания тестов любой сложности</p>
          </div>
        </div>
      )
    },
    {
      title: "Разнообразие вопросов",
      subtitle: "Поддержка всех типов вопросов: выбор, текст, множественный выбор",
      bgColor: "from-purple-600 to-pink-500",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(questionTypes).map((type, i) => (
            <div key={i} className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-lg`}>
              <div className="text-3xl mb-3">{type.icon}</div>
              <h4 className="font-bold mb-2">{type.label}</h4>
              <p className="text-sm opacity-80">Полная поддержка этого типа вопросов</p>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Анализ результатов",
      subtitle: "Сбор и анализ ответов в удобном формате",
      bgColor: "from-pink-500 to-red-500",
      content: (
        <div className={`p-8 rounded-2xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-2xl`}>
          <h3 className="text-xl font-bold mb-4">Экспорт в Excel</h3>
          <div className="flex justify-center">
            <Download size={48} className="text-green-500" />
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    const handleScroll = (e) => {
      if (e.deltaY > 0) {
        setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
      } else {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      }
    };

    const container = containerRef.current;
    container.addEventListener('wheel', handleScroll);
    
    return () => {
      container.removeEventListener('wheel', handleScroll);
    };
  }, []);

  const handleAuth = async (type) => {
    try {
      let users = [];
      const fakeFileContent = localStorage.getItem('users_db') || '';
      users = fakeFileContent.split('\n').filter(Boolean).map(line => {
        const [user, pass] = line.split(':');
        return { username: user, password: pass };
      });
      
      if (type === 'register') {
        if (users.some(u => u.username === username)) {
          alert('Имя пользователя уже занято');
          return;
        }
        
        const newUser = `${username}:${password}\n`;
        localStorage.setItem('users_db', (localStorage.getItem('users_db') || '') + newUser);
        localStorage.setItem('currentUser', username);
        alert('Регистрация успешна! Теперь вы можете войти.');
        setAuthModal(null);
        window.location.reload();
      } else {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
          localStorage.setItem('currentUser', username);
          setAuthModal(null);
          window.location.reload();
        } else {
          alert('Неверное имя пользователя или пароль');
        }
      }
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };

  const isLoggedIn = !!localStorage.getItem('currentUser');

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
    >
      <nav className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center">
        <div 
          onClick={() => !isLoggedIn && setAuthModal('register')}
          className={`text-2xl font-bold cursor-pointer ${!isLoggedIn ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>Form</span>Builder
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <User size={18} />
              <span>Личный кабинет</span>
            </Link>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setAuthModal('login')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <LogIn size={18} />
                <span>Вход</span>
              </button>
              <button
                onClick={() => setAuthModal('register')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
              >
                <User size={18} />
                <span>Регистрация</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="h-screen w-full relative" style={{ transform: `translateY(-${currentSlide * 100}vh`, transition: 'transform 0.7s cubic-bezier(0.33, 1, 0.68, 1)' }}>
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`h-screen w-full flex flex-col justify-center items-center p-8 bg-gradient-to-br ${slide.bgColor} text-white`}
          >
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up">{slide.title}</h1>
              <p className="text-xl md:text-2xl mb-12 opacity-90 animate-fade-in-up delay-100">{slide.subtitle}</p>
              
              <div className="animate-fade-in-up delay-200">
                {slide.content}
              </div>
              
              {index === slides.length - 1 && (
                <div className="mt-16 animate-bounce">
                  <button
                    onClick={() => isLoggedIn ? navigate('/builder') : setAuthModal('register')}
                    className={`inline-block px-8 py-4 text-lg font-bold rounded-full shadow-lg ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'} transition-colors`}
                  >
                    {isLoggedIn ? 'Создать тест' : 'Начать создавать'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-3 h-3 rounded-full ${i === currentSlide ? 'bg-white' : 'bg-white bg-opacity-30'}`}
                  aria-label={`Перейти к слайду ${i + 1}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {authModal && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${darkMode ? 'dark' : ''}`}>
          <div className={`rounded-xl p-6 w-full max-w-md mx-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {authModal === 'login' ? 'Вход в систему' : 'Регистрация'}
              </h3>
              <button
                onClick={() => setAuthModal(null)}
                className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Имя пользователя</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                />
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                />
              </div>
              
              <button
                onClick={() => handleAuth(authModal)}
                className={`w-full px-6 py-3 font-semibold rounded-lg shadow-md hover:shadow-lg transition ${darkMode ? 'bg-gradient-to-r from-green-700 to-green-600' : 'bg-gradient-to-r from-green-600 to-green-500'} text-white`}
              >
                {authModal === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент модального окна выбора типа вопроса
const QuestionTypeModal = ({ isOpen, onClose, onSelect, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${darkMode ? 'dark' : ''}`}>
      <div className={`rounded-xl p-6 w-full max-w-md mx-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Выберите тип вопроса</h3>
          <button
            onClick={onClose}
            className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition`}
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(questionTypes).map(([type, { label, icon, color, darkColor }]) => (
            <button
              key={type}
              onClick={() => {
                onSelect(type);
                onClose();
              }}
              className={`w-full flex items-center gap-3 p-4 rounded-lg ${darkMode ? darkColor : color} hover:opacity-90 transition`}
            >
              <span className="text-xl">{icon}</span>
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Компонент блока вопроса
const QuestionBlock = ({ id, children, darkMode }) => {
  return (
    <div className={`relative mb-4 p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white shadow-sm'} transition-shadow`}>
      {children}
    </div>
  );
};

// Компонент просмотра теста
const TestPreview = () => {
  const { testId } = useParams();
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [password, setPassword] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
    }
  }, []);

  useEffect(() => {
    const loadTest = () => {
      try {
        const savedTests = JSON.parse(localStorage.getItem('tests') || '{}');
        if (savedTests[testId]) {
          setTestData(savedTests[testId]);
          setCorrectAnswers(savedTests[testId].correctAnswers || {});
        }
        setLoading(false);
      } catch (error) {
        console.error('Ошибка загрузки теста:', error);
        setLoading(false);
      }
    };

    loadTest();
  }, [testId]);

  const handleAnswerChange = (blockId, value) => {
    setAnswers((prev) => ({ ...prev, [blockId]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const userResponses = JSON.parse(localStorage.getItem('userResponses') || '{}');
    userResponses[testId] = userResponses[testId] || [];
    userResponses[testId].push({
      date: new Date().toISOString(),
      answers
    });
    localStorage.setItem('userResponses', JSON.stringify(userResponses));
  };

  const checkPassword = () => {
    const savedTests = JSON.parse(localStorage.getItem('tests') || '{}');
    if (savedTests[testId] && savedTests[testId].password === password) {
      setShowResults(true);
    } else {
      alert('Неверный пароль');
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        Загрузка теста...
      </div>
    );
  }

  if (!testData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="text-center p-6 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Тест не найден</h2>
          <p className="mb-4">Возможно, ссылка устарела или была изменена.</p>
          <Link
            to="/"
            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition`}
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  const renderQuestionBlock = (block) => {
    const typeInfo = questionTypes[block.type];
    return (
      <div key={block.id} className={`mb-6 p-6 rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border shadow-sm hover:shadow-md transition-shadow`}>
        <div className="flex flex-col">
          <div className="flex justify-end mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${darkMode ? typeInfo.darkColor : typeInfo.color}`}>
              {typeInfo.icon} {typeInfo.label}
            </span>
          </div>

          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            {block.question || "Вопрос без названия"}
          </h3>

          {block.type === "textInput" && (
            <input
              type="text"
              disabled={submitted}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${darkMode ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-300' : 'border-gray-300'} ${submitted ? 'opacity-70' : ''}`}
              placeholder="Введите ваш ответ..."
              value={answers[block.id] || ""}
              onChange={(e) => handleAnswerChange(block.id, e.target.value)}
            />
          )}

          {(block.type === "singleChoice" || block.type === "multipleChoice") && (
            <div className="space-y-2">
              {block.options.map((opt, i) => (
                <label key={i} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'} ${submitted ? 'cursor-default' : ''}`}>
                  <input
                    type={block.type === "singleChoice" ? "radio" : "checkbox"}
                    name={`${block.type}-${block.id}`}
                    value={opt}
                    checked={
                      block.type === "singleChoice"
                        ? answers[block.id] === opt
                        : answers[block.id]?.includes(opt) || false
                    }
                    onChange={(e) => {
                      if (block.type === "singleChoice") {
                        handleAnswerChange(block.id, e.target.value);
                      } else {
                        const prev = answers[block.id] || [];
                        if (e.target.checked) {
                          handleAnswerChange(block.id, [...prev, opt]);
                        } else {
                          handleAnswerChange(block.id, prev.filter((o) => o !== opt));
                        }
                      }
                    }}
                    className={`h-5 w-5 ${block.type === "singleChoice" ? 'text-blue-600 focus:ring-blue-500 rounded-full' : 'text-purple-600 focus:ring-purple-500 rounded'}`}
                    disabled={submitted}
                  />
                  <span className={darkMode ? 'text-gray-100' : 'text-gray-700'}>
                    {opt}
                    {showResults && (
                      ((block.type === "singleChoice" && correctAnswers[block.id] === opt) ||
                      (block.type === "multipleChoice" && correctAnswers[block.id]?.includes(opt))) && 
                      <span className="ml-2 text-green-500">✓ Правильный ответ</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6 transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-2xl shadow-xl overflow-hidden mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white relative">
            <div className="flex justify-between items-center">
              <Link to="/" className="flex items-center gap-2 text-white hover:text-gray-200">
                <Home size={20} />
                <span className="font-semibold">На главную</span>
              </Link>
              <div className="flex items-center gap-4">
                {localStorage.getItem('currentUser') && (
                  <Link 
                    to="/dashboard" 
                    className="flex items-center gap-2 text-white hover:text-gray-200"
                  >
                    <User size={20} />
                    <span className="font-semibold">Личный кабинет</span>
                  </Link>
                )}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-full bg-black bg-opacity-20 hover:bg-opacity-30 transition"
                  title={darkMode ? "Светлая тема" : "Тёмная тема"}
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>

            <h1 className="text-3xl font-bold mt-4">{testData.title || "Тест без названия"}</h1>
            <p className="opacity-90">{testData.description || "Описание теста"}</p>
          </div>
        </div>

        {submitted ? (
          <div className={`p-6 rounded-xl mb-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
            <h2 className="text-2xl font-bold mb-4">Спасибо за прохождение теста!</h2>
            <p className="mb-4">Ваши ответы сохранены.</p>

            {!showResults && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Для просмотра правильных ответов введите пароль:</h3>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                    className={`px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                  />
                  <button
                    onClick={checkPassword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Проверить
                  </button>
                </div>
              </div>
            )}

            {showResults && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Правильные ответы:</h3>
                {testData.blocks.map((block) => (
                  <div key={block.id} className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <h4 className="font-medium mb-2">{block.question}</h4>
                    <p>
                      {block.type === 'textInput' ? (
                        <span className="font-semibold">{correctAnswers[block.id]}</span>
                      ) : block.type === 'singleChoice' ? (
                        <span className="font-semibold">{correctAnswers[block.id]}</span>
                      ) : (
                        <span className="font-semibold">{correctAnswers[block.id]?.join(', ')}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {testData.blocks.map((block) => renderQuestionBlock(block))}
            <button
              onClick={handleSubmit}
              className={`w-full py-3 font-semibold rounded-lg shadow-md hover:shadow-lg transition ${darkMode ? 'bg-gradient-to-r from-green-700 to-green-600' : 'bg-gradient-to-r from-green-600 to-green-500 text-white'}`}
            >
              Отправить ответы
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Компонент конструктора форм
const FormBuilder = () => {
  const [blocks, setBlocks] = useState([]);
  const [preview, setPreview] = useState(false);
  const [answers, setAnswers] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState({});
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [testLink, setTestLink] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const addBlock = (type) => {
    setBlocks([
      ...blocks,
      {
        id: Date.now(),
        type,
        question: "",
        options: type !== "textInput" ? ["Вариант 1", "Вариант 2"] : [],
      },
    ]);
  };

  const updateBlock = (id, data) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...data } : b)));
  };

  const updateOption = (blockId, index, value) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id === blockId) {
          const newOptions = [...b.options];
          newOptions[index] = value;
          return { ...b, options: newOptions };
        }
        return b;
      })
    );
  };

  const addOption = (blockId) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId ? { ...b, options: [...b.options, `Вариант ${b.options.length + 1}`] } : b
      )
    );
  };

  const removeOption = (blockId, index) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id === blockId) {
          const newOptions = [...b.options];
          newOptions.splice(index, 1);

          const newCorrectAnswers = { ...correctAnswers };
          if (b.type === "singleChoice") {
            if (newCorrectAnswers[blockId] === b.options[index]) {
              delete newCorrectAnswers[blockId];
            }
          } else if (b.type === "multipleChoice") {
            if (Array.isArray(newCorrectAnswers[blockId])) {
              newCorrectAnswers[blockId] = newCorrectAnswers[blockId].filter(
                opt => opt !== b.options[index]
              );
              if (newCorrectAnswers[blockId].length === 0) {
                delete newCorrectAnswers[blockId];
              }
            }
          }
          setCorrectAnswers(newCorrectAnswers);

          return { ...b, options: newOptions };
        }
        return b;
      })
    );
  };

  const removeBlock = (id) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const handleAnswerChange = (blockId, value) => {
    setAnswers((prev) => ({ ...prev, [blockId]: value }));
  };

  const handleSubmit = () => {
    const data = blocks.map((block) => ({
      Вопрос: block.question,
      Ответ: Array.isArray(answers[block.id])
        ? answers[block.id].join(", ")
        : answers[block.id] || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ответы");
    XLSX.writeFile(workbook, "ответы_формы.xlsx");
  };

  const downloadTemplate = () => {
    const data = {
      title: testTitle,
      description: testDescription,
      blocks,
      correctAnswers
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "шаблон_формы.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const saveTestAndGenerateLink = () => {
    if (!testTitle.trim()) {
      alert("Пожалуйста, укажите название теста");
      return;
    }

    if (!testPassword.trim()) {
      alert("Пожалуйста, установите пароль для просмотра ответов");
      return;
    }

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
      return;
    }

    const testId = 'test_' + Date.now();
    const testData = {
      title: testTitle,
      description: testDescription,
      blocks,
      correctAnswers,
      password: testPassword,
      createdAt: new Date().toISOString(),
      creator: currentUser
    };

    const savedTests = JSON.parse(localStorage.getItem('tests') || '{}');
    savedTests[testId] = testData;
    localStorage.setItem('tests', JSON.stringify(savedTests));

    const link = `${window.location.origin}/test/${testId}`;
    setTestLink(link);
    setShowLinkModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(testLink);
    alert('Ссылка скопирована в буфер обмена');
  };

  const setCorrectAnswer = (blockId, answer) => {
    setCorrectAnswers(prev => ({ ...prev, [blockId]: answer }));
  };

  const toggleCorrectAnswer = (blockId, answer, isMultiple) => {
    if (isMultiple) {
      setCorrectAnswers(prev => {
        const current = prev[blockId] || [];
        const newAnswers = current.includes(answer)
          ? current.filter(a => a !== answer)
          : [...current, answer];
        return { ...prev, [blockId]: newAnswers };
      });
    } else {
      setCorrectAnswers(prev => ({
        ...prev,
        [blockId]: prev[blockId] === answer ? undefined : answer
      }));
    }
  };

  const renderPreviewBlock = (block) => {
    const typeInfo = questionTypes[block.type];
    return (
      <div key={block.id} className={`mb-6 p-6 rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border shadow-sm hover:shadow-md transition-shadow`}>
        <div className="flex flex-col">
          <div className="flex justify-end mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${darkMode ? typeInfo.darkColor : typeInfo.color}`}>
              {typeInfo.icon} {typeInfo.label}
            </span>
          </div>

          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            {block.question || "Вопрос без названия"}
          </h3>

          {block.type === "textInput" && (
            <div>
              <input
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${darkMode ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-300' : 'border-gray-300'}`}
                placeholder="Введите ваш ответ..."
                value={answers[block.id] || ""}
                onChange={(e) => handleAnswerChange(block.id, e.target.value)}
              />
              <div className="mt-2">
                <label className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Правильный ответ:
                  <input
                    type="text"
                    value={correctAnswers[block.id] || ''}
                    onChange={(e) => setCorrectAnswer(block.id, e.target.value)}
                    className={`ml-2 px-3 py-1 border rounded ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300'}`}
                    placeholder="Введите правильный ответ"
                  />
                </label>
              </div>
            </div>
          )}

          {(block.type === "singleChoice" || block.type === "multipleChoice") && (
            <div className="space-y-2">
              {block.options.map((opt, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type={block.type === "singleChoice" ? "radio" : "checkbox"}
                      checked={
                        block.type === "singleChoice"
                          ? answers[block.id] === opt
                          : answers[block.id]?.includes(opt) || false
                      }
                      onChange={(e) => {
                        if (block.type === "singleChoice") {
                          handleAnswerChange(block.id, opt);
                        } else {
                          const prev = answers[block.id] || [];
                          if (e.target.checked) {
                            handleAnswerChange(block.id, [...prev, opt]);
                          } else {
                            handleAnswerChange(block.id, prev.filter((o) => o !== opt));
                          }
                        }
                      }}
                      className={`h-5 w-5 ${block.type === "singleChoice" ? 'text-blue-600 focus:ring-blue-500 rounded-full' : 'text-purple-600 focus:ring-purple-500 rounded'}`}
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(block.id, i, e.target.value)}
                      className={`flex-1 px-3 py-1 border-b focus:border-blue-500 focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                    />
                  </div>
                  <button
                    onClick={() => toggleCorrectAnswer(block.id, opt, block.type === "multipleChoice")}
                    className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-200'}`}
                    title="Отметить как правильный"
                  >
                    <Check
                      size={18}
                      className={
                        (block.type === "singleChoice" && correctAnswers[block.id] === opt) ||
                          (block.type === "multipleChoice" && correctAnswers[block.id]?.includes(opt))
                          ? "text-green-500"
                          : darkMode ? "text-gray-400" : "text-gray-300"
                      }
                    />
                  </button>
                  <button
                    onClick={() => removeOption(block.id, i)}
                    className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-200 text-gray-500'}`}
                    title="Удалить вариант"
                    disabled={block.options.length <= 1}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addOption(block.id)}
                className={`mt-2 flex items-center gap-2 px-3 py-1 rounded-lg ${darkMode ? 'text-blue-400 hover:bg-gray-600' : 'text-blue-600 hover:bg-gray-100'}`}
              >
                <Plus size={16} />
                <span>Добавить вариант</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} p-6 transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-2xl shadow-xl overflow-hidden mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white relative">
            <div className="flex justify-between items-center">
              <Link to="/" className="flex items-center gap-2 text-white hover:text-gray-200">
                <Home size={20} />
                <span className="font-semibold">На главную</span>
              </Link>
              <div className="flex items-center gap-4">
                {localStorage.getItem('currentUser') && (
                  <Link 
                    to="/dashboard" 
                    className="flex items-center gap-2 text-white hover:text-gray-200"
                  >
                    <User size={20} />
                    <span className="font-semibold">Личный кабинет</span>
                  </Link>
                )}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-full bg-black bg-opacity-20 hover:bg-opacity-30 transition"
                  title={darkMode ? "Светлая тема" : "Тёмная тема"}
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>

            <h1 className="text-3xl font-bold mt-4">Интерактивная система тестирования</h1>
            <p className="opacity-90">Создавайте красивые тесты легко</p>
          </div>

          <div className={`p-6 flex flex-wrap gap-3 border-b ${darkMode ? 'border-gray-700' : ''}`}>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={18} />
              <span>Добавить вопрос</span>
            </button>

            <button
              onClick={() => setPreview(!preview)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 transition ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600' : 'bg-white border border-gray-300 text-gray-700'
                }`}
            >
              {preview ? <Edit size={18} /> : <Eye size={18} />}
              <span>{preview ? "Редактировать" : "Предпросмотр"}</span>
            </button>

            <button
              onClick={downloadTemplate}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 transition ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600' : 'bg-white border border-gray-300 text-gray-700'
                }`}
            >
              <Download size={18} />
              <span>Сохранить шаблон</span>
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 transition ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600' : 'bg-white border border-gray-300 text-gray-700'
                }`}
            >
              <Settings size={18} />
              <span>Настройки теста</span>
            </button>
          </div>
        </div>

        <QuestionTypeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={(type) => addBlock(type)}
          darkMode={darkMode}
        />

        {showSettingsModal && (
          <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${darkMode ? 'dark' : ''}`}>
            <div className={`rounded-xl p-6 w-full max-w-md mx-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Настройки теста</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Название теста</label>
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="Введите название теста"
                    className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                      }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Описание теста</label>
                  <textarea
                    value={testDescription}
                    onChange={(e) => setTestDescription(e.target.value)}
                    placeholder="Введите описание теста"
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                      }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Пароль для просмотра ответов</label>
                  <input
                    type="password"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    placeholder="Установите пароль"
                    className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                      }`}
                  />
                </div>
                <button
                  onClick={() => {
                    saveTestAndGenerateLink();
                    setShowSettingsModal(false);
                  }}
                  disabled={!testTitle.trim() || !testPassword.trim()}
                  className={`w-full px-6 py-3 font-semibold rounded-lg shadow-md hover:shadow-lg transition ${darkMode ? 'bg-gradient-to-r from-green-700 to-green-600' : 'bg-gradient-to-r from-green-600 to-green-500 text-white'
                    } ${(!testTitle.trim() || !testPassword.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <LinkIcon size={18} />
                    <span>Создать ссылку на тест</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {showLinkModal && (
          <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${darkMode ? 'dark' : ''}`}>
            <div className={`rounded-xl p-6 w-full max-w-md mx-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Ссылка на тест</h3>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <p className="mb-2">Отправьте эту ссылку участникам тестирования:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testLink}
                    readOnly
                    className={`flex-1 px-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                      }`}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <LinkIcon size={18} />
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="font-medium mb-2">Пароль для просмотра ответов:</p>
                <p className="font-mono">{testPassword}</p>
              </div>
            </div>
          </div>
        )}

        {preview ? (
          <div className="space-y-6">
            {blocks.length === 0 ? (
              <div className={`p-8 rounded-xl text-center border-2 border-dashed ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-500'
                }`}>
                <p className="text-lg">Нет добавленных вопросов</p>
                <button
                  onClick={() => setPreview(false)}
                  className={`mt-4 px-4 py-2 rounded-lg hover:bg-blue-700 transition ${darkMode ? 'bg-blue-600' : 'bg-blue-600 text-white'
                    }`}
                >
                  Добавить вопросы
                </button>
              </div>
            ) : (
              <>
                {blocks.map((block) => renderPreviewBlock(block))}
                <button
                  onClick={handleSubmit}
                  className={`w-full py-3 font-semibold rounded-lg shadow-md hover:shadow-lg transition ${darkMode ? 'bg-gradient-to-r from-green-700 to-green-600' : 'bg-gradient-to-r from-green-600 to-green-500 text-white'
                    }`}
                >
                  Отправить и экспортировать в Excel
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.length === 0 && (
              <div className={`p-8 rounded-xl text-center border-2 border-dashed ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-300'
                }`}>
                <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Ваш тест пока пуст</p>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-400'}>Добавьте первый вопрос, используя кнопку выше</p>
              </div>
            )}

            {blocks.map((block) => (
              <QuestionBlock
                key={block.id}
                id={block.id}
                darkMode={darkMode}
              >
                <div className="ml-6">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={block.question}
                        onChange={(e) => updateBlock(block.id, { question: e.target.value })}
                        placeholder="Введите текст вопроса"
                        className={`w-full px-4 py-2 text-lg font-semibold border-b focus:border-blue-500 focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'
                          }`}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${darkMode ? questionTypes[block.type].darkColor : questionTypes[block.type].color
                        }`}>
                        {questionTypes[block.type].icon} {questionTypes[block.type].label}
                      </span>
                      <button
                        onClick={() => removeBlock(block.id)}
                        className={`p-2 rounded-full hover:bg-red-50 transition ${darkMode ? 'text-gray-300 hover:text-red-400 hover:bg-gray-600' : 'text-gray-400 hover:text-red-500'
                          }`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {block.type === "textInput" && (
                    <div className="ml-12 pl-3">
                      <input
                        type="text"
                        disabled
                        placeholder="Текстовый ответ будет здесь"
                        className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-600 border-gray-500 text-gray-300 placeholder-gray-400' : 'bg-gray-100 border border-gray-200 text-gray-500'
                          }`}
                      />
                      <div className="mt-2">
                        <label className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                          <Lock size={16} />
                          Правильный ответ:
                          <input
                            type="text"
                            value={correctAnswers[block.id] || ''}
                            onChange={(e) => setCorrectAnswer(block.id, e.target.value)}
                            className={`ml-2 px-3 py-1 border rounded ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300'
                              }`}
                            placeholder="Введите правильный ответ"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {(block.type === "singleChoice" || block.type === "multipleChoice") && (
                    <div className="ml-12 pl-3 space-y-3">
                      {block.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-5 h-5 ${block.type === "singleChoice" ? 'rounded-full border' : 'rounded border'}`}></div>
                            <input
                              value={opt}
                              onChange={(e) => updateOption(block.id, idx, e.target.value)}
                              placeholder={`Вариант ${idx + 1}`}
                              className={`flex-1 px-3 py-1 border-b focus:border-blue-500 focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                                }`}
                            />
                          </div>
                          <button
                            onClick={() => toggleCorrectAnswer(block.id, opt, block.type === "multipleChoice")}
                            className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-200'}`}
                            title="Отметить как правильный"
                          >
                            <Check
                              size={18}
                              className={
                                (block.type === "singleChoice" && correctAnswers[block.id] === opt) ||
                                  (block.type === "multipleChoice" && correctAnswers[block.id]?.includes(opt))
                                  ? "text-green-500"
                                  : darkMode ? "text-gray-400" : "text-gray-300"
                              }
                            />
                          </button>
                          <button
                            onClick={() => removeOption(block.id, idx)}
                            className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-500 text-gray-300' : 'hover:bg-gray-200 text-gray-500'}`}
                            title="Удалить вариант"
                            disabled={block.options.length <= 1}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(block.id)}
                        className={`mt-2 flex items-center gap-2 px-3 py-1 rounded-lg ${darkMode ? 'text-blue-400 hover:bg-gray-600' : 'text-blue-600 hover:bg-gray-100'}`}
                      >
                        <Plus size={16} />
                        <span>Добавить вариант</span>
                      </button>
                    </div>
                  )}
                </div>
              </QuestionBlock>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Главный компонент приложения
const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<LandingPage darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} 
        />
        <Route path="/builder" element={<FormBuilder />} />
        <Route path="/test/:testId" element={<TestPreview />} />
        <Route path="/dashboard" element={<UserDashboard darkMode={darkMode} />} />
      </Routes>
    </Router>
  );
};

export default App;