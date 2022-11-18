import React, {Component} from "react";
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, ImageBackground, KeyboardAvoidingView, ToastAndroid, Alert } from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import {Camera} from "expo-camera";
import db from "../config";
import firebase from "firebase";

const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");
const appName = require("../assets/appName.png");

export default class TransactionScreen extends Component{
    constructor(props){
        super(props);
        this.state = {
            domState: "normal",
            hasCameraPermissions: null,
            scanned: false,
            scannedData: "",
            bookId: "",
            studentId: "",
            bookName: "",
            studentName: ""
        }
    }

    getCameraPermissions = async domState => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        this.setState({
            hasCameraPermissions: status === "granted",
            domState: domState,
            scanned: false
        })
    };

    handleBarCodeScanned = async ({ type, data }) => {
        const { domState } = this.state;
        if(domState === "bookId"){
          this.setState({
            bookId: data,
            domState: "normal",
            scanned: true
          });
        } else if (domState === "studentId"){
          this.setState({
            studentId: data,
            domState: "normal",
            scanned: true
          });
        }
      };

    handleTransaction = async () => {
      var {bookId, studentId} = this.state;
      await this.getBookDetails(bookId);
      await this.getStudentDetails(studentId);

      var transactionType = await this.checkBookAvailability(bookId);

      if(!transactionType){
        this.setState({bookId: "", studentId: ""})
        Alert.alert("Infelizmente nós ainda não temos esse livro, tente pegar outro.");
      } else if(transactionType === "issue"){
        var isEligible = await this.checkStudentForIssue(studentId);
        if(isEligible){
          var {bookName, studentName} = this.state;
          this.initiateBookIssue(bookId, studentId, bookName, studentName);
        }
          ToastAndroid.show("Livro entregue para o aluno!", ToastAndroid.SHORT);
      } else {
        var isEligible = await this.checkStudentForReturn(studentId, bookId);
        if(isEligible){
          var {bookName, studentName} = this.state;
          this.initiateBookReturn(bookId, studentId, bookName, studentName);
        }
          ToastAndroid.show("Livro devolvido a biblioteca da escola!", ToastAndroid.SHORT);
      }
    }

    checkStudentForIssue = async studentId => {
      const studentRef = await db.collection("students")
                              .where("student_id", "==", studentId)
                              .get();
      var isStudentAvailable = "";
      if(studentRef.docs.length == 0){
        this.setState({bookId: "", studentId: ""})
        isStudentAvailable = false;
        Alert.alert("Esse aluno não está mais na escola.")
      } else {
        studentRef.docs.map(doc=>{
          if(doc.data().number_of_books_issued < 2){
            isStudentAvailable = true;
          } else {
            isStudentAvailable = false;
            Alert.alert("Você quer ser um professor?");
            this.setState({bookId: "", studentId: ""})
          }
        })
      }
      return isStudentAvailable;
    }

    checkStudentForReturn = async(bookId, studentId) => {
      const transactionRef = await db.collection("transactions")
                                     .where("book_id", "==", bookId)
                                     .limit(1)
                                     .get();
      var isStudentAvailable = "";
      transactionRef.docs.map(doc=>{
        var lastBookTransaction = doc.data();
        if(lastBookTransaction.student_id === studentId){
          isStudentAvailable = true;
        } else {
          isStudentAvailable = false;
          Alert.alert("Me desculpe mas não foi você quem pegou este livro, e a pessoa que pegou pode ainda estar lendo.");
          this.setState({bookId: "", studentId: ""})
        }
      })
      return isStudentAvailable;
    }

    initiateBookIssue = async (bookId, studentId, bookName, studentName) => {
      //adicionar uma transação
      db.collection("transactions").add({
        student_id: studentId,
        student_name: studentName,
        book_id: bookId,
        book_name: bookName,
        date: firebase.firestore.Timestamp.now().toDate(),
        transaction_type: "issue"
      });
      //alterar o status do livro
      db.collection("books")
        .doc(bookId)
        .update({
          is_book_available: false
        });
      //alterar o número de livros retirados pelo aluno
      db.collection("students")
        .doc(studentId)
        .update({
          number_of_books_issued: firebase.firestore.FieldValue.increment(1)
        });
      //atualizar o estado local
      this.setState({
        bookId: "",
        studentId: ""
      })
    }

    initiateBookReturn = async (bookId, studentId, bookName, studentName) => {
      //adicionar uma transação
      db.collection("transactions").add({
        student_id: studentId,
        student_name: studentName,
        book_id: bookId,
        book_name: bookName,
        date: firebase.firestore.Timestamp.now().toDate(),
        transaction_type: "return"
      });
      //alterar o status do livro
      db.collection("books")
        .doc(bookId)
        .update({
          is_book_available: true
        });
      //alterar o número de livros retirados pelo aluno
      db.collection("students")
        .doc(studentId)
        .update({
          number_of_books_issued: firebase.firestore.FieldValue.increment(-1)
        });
      //atualizar o estado local
      this.setState({
        bookId: "",
        studentId: ""
      })
    }

    getBookDetails = bookId => {
      bookId = bookId.trim();
      db.collection("books")
        .where("book_id","==",bookId)
        .get()
        .then(snapshot => {
          snapshot.docs.map(doc => {
            this.setState({
              bookName: doc.data().book_name
            })
          })
        })
    }

    getStudentDetails = studentId => {
      studentId = studentId.trim();
      db.collection("students")
        .where("student_id","==",studentId)
        .get()
        .then(snapshot => {
          snapshot.docs.map(doc => {
            this.setState({
              studentName: doc.data().student_name
            })
          })
        })
    }

    checkBookAvailability = async bookId => {
      const bookRef = await db.collection("books")
                              .where("book_id", "==", bookId)
                              .get();
      var transactionType = "";
      if(bookRef.docs.length == 0){
        this.setState({bookId: "", studentId: ""})
        transactionType = false;
      } else {
        bookRef.docs.map(doc=>{
          transactionType = doc.data().is_book_available ?
                                      "issue" : "return";
        })
      }
      return transactionType;
    }

    render(){
        const {domState, hasCameraPermissions, scannedData, scanned, bookId, studentId} = this.state;
        if(domState !== "normal"){
            return(
                <BarCodeScanner
                    onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
                    style={StyleSheet.absoluteFillObject}
                />
            )
        }
        return (
            <KeyboardAvoidingView behavior="padding" style={styles.container}>
                <ImageBackground source={bgImage} style={styles.bgImage}>
                    <View style={styles.upperContainer}>
                        <Image source={appIcon} style={styles.appIcon}/>
                        <Image source={appName} style={styles.appName}/>
                    </View>
              <View style={styles.lowerContainer}>
                <View style={styles.textInputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder={"Id livro"}
                      placeholderTextColor={"#FFFFFF"}
                      value={bookId}
                      onChangeText={text=> this.setState({bookId: text})}
                      />
                    <TouchableOpacity
                      style={styles.scanbutton}
                      onPress={()=>this.getCameraPermissions("bookId")}
                    >
                    <Text style={styles.scanButtonText}>Digitalizar</Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.textInputContainer,{marginTop: 25}]}>
                    <TextInput
                      style={styles.textInput}
                      placeholder={"Id aluno"}
                      placeholderTextColor={"#FFFFFF"}
                      value={studentId}
                      onChangeText={text=> this.setState({studentId: text})}
                      />
                    <TouchableOpacity
                      style={styles.scanbutton}
                      onPress={()=>this.getCameraPermissions("studentId")}
                    >
                    <Text style={styles.scanButtonText}>Digitalizar</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.button, {maginTop: 25}]}
                                  onPress={this.handleTransaction}>
                  <Text style={styles.buttonText}>Enviar</Text>
                </TouchableOpacity>
              </View>
              </ImageBackground>
            </KeyboardAvoidingView>
          );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#5653D4"
    },
    text: {
        color: "#FFF",
        fontSize: 30
    },
    button: {
        width: "43%",
        height: 80,
        margin: 25,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F48D20",
        borderRadius: 15
    },
    buttonText: {
        fontSize: 24,
        color: "#FFF"
    },
    lowerContainer: {
        flex: 0.5,
        alignItems: "center"
      },
      textInputContainer: {
        borderWidth: 2,
        borderRadius: 10,
        flexDirection: "row",
        backgroundColor: "#9DFD24",
        borderColor: "#FFFFFF"
      },
      textInput: {
        width: "57%",
        height: 50,
        padding: 10,
        borderColor: "#FFFFFF",
        borderRadius: 10,
        borderWidth: 3,
        fontSize: 18,
        backgroundColor: "#5653D4",
        fontFamily: "Rajdhani_600SemiBold",
        color: "#FFFFFF"
      },
      scanbutton: {
        width: 100,
        height: 50,
        backgroundColor: "#9DFD24",
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        justifyContent: "center",
        alignItems: "center"
      },
      scanButtonText: {
        fontSize: 20,
        color: "#0A0101",
        fontFamily: "Rajdhani_600SemiBold"
      },
      bgImage: {
        flex: 1,
        resizeMode: "cover",
        justifyContent: "center"
      },
      upperContainer: {
        flex: 0.5,
        justifyContent: "center",
        alignItems: "center"
      },
      appIcon: {
        width: 200,
        height: 200,
        resizeMode: "contain",
        marginTop: 80
      },
      appName: {
        width: 180,
        resizeMode: "contain"
      },
})