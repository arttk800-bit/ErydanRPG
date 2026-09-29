package ru.eyrdan.rpg

import java.security.SecureRandom

data class DiceResult(val natural:Int,val modifier:Int,val total:Int,val dc:Int) {
    val criticalSuccess get()=natural==20
    val criticalFailure get()=natural==1
    val success get()=criticalSuccess || (!criticalFailure && total>=dc)
}
object DiceEngine {
    private val random=SecureRandom()
    fun d20(modifier:Int=0,dc:Int=10):DiceResult {
        val n=random.nextInt(20)+1
        return DiceResult(n,modifier,n+modifier,dc.coerceIn(1,30))
    }
}
